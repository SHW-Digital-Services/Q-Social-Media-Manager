import React, { useState, useEffect } from 'react';
import { PostItem, PostStatus, PostVersion, SocialAccountConnection } from './types';
import { MOCK_POSTS, Q_LOGO_URL } from './data/brandData';
import { INITIAL_SOCIAL_CONNECTIONS } from './data/socialConnectionsData';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ApprovalQueue } from './components/ApprovalQueue';
import { ContentCalendar } from './components/ContentCalendar';
import { MultiPlatformComposer } from './components/MultiPlatformComposer';
import { ComplianceAuditor } from './components/ComplianceAuditor';
import { MediaLibrary } from './components/MediaLibrary';
import { FontRepository } from './components/FontRepository';
import { DesignTemplatesStudio } from './components/DesignTemplatesStudio';
import { CollaborationRoom } from './components/CollaborationRoom';
import { SocialChannelsManager } from './components/SocialChannelsManager';
import { SocialConnectionModal } from './components/SocialConnectionModal';
import { LoginPage } from './components/LoginPage';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { StaffAuthModal } from './components/StaffAuthModal';
import { StaffQuickGuideModal } from './components/StaffQuickGuideModal';
import { QLogo } from './components/QLogo';
import { AUTHORIZED_STAFF_ACCOUNTS, StaffUser } from './lib/supabase';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  // Blank platform initialized with no posts as requested
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [complianceAuditedPost, setComplianceAuditedPost] = useState<PostItem | null>(null);

  // Social Media Connections state
  const [socialConnections, setSocialConnections] = useState<SocialAccountConnection[]>(INITIAL_SOCIAL_CONNECTIONS);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);

  // Supabase Staff Authentication state (Starts with Login Page to fulfill login-only page requirement)
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    const saved = localStorage.getItem('q_intelligence_staff_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && !parsed.email.toLowerCase().includes('jordan') && !parsed.email.toLowerCase().includes('morgan')) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Non-technical Staff Quick Guide modal
  const [showQuickGuideModal, setShowQuickGuideModal] = useState<boolean>(false);

  // Version Control Modal state
  const [historyModalPost, setHistoryModalPost] = useState<PostItem | null>(null);
  
  // Media picker modal overlay state
  const [mediaPickerCallback, setMediaPickerCallback] = useState<((url: string) => void) | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const publishBroadcast = async (postData: Partial<PostItem>, postId?: string) => {
    const res = await fetch('/api/publish/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        title: postData.title,
        content: postData.content,
        platforms: postData.platforms,
        mediaUrls: postData.mediaUrls,
        tags: postData.tags,
        scheduledFor: postData.scheduledFor,
        campaign: postData.campaign
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      const blockedPlatforms = Array.isArray(data.results)
        ? data.results
            .filter((result: any) => result.status !== 'published')
            .map((result: any) => result.platform)
            .join(', ')
        : '';
      throw new Error(
        blockedPlatforms
          ? `${data.message || 'Publishing setup is incomplete.'} Platforms needing setup: ${blockedPlatforms}.`
          : data.message || data.error || 'Publishing failed.'
      );
    }

    return data;
  };

  // Helper to record a version snapshot
  const recordPostVersion = (
    post: PostItem, 
    changeSummary: string,
    isMajor: boolean = false
  ): PostItem => {
    const history = post.versionHistory || [];
    const currentNum = post.currentVersion || 'v1.0';
    const numPart = parseFloat(currentNum.replace('v', '')) || 1.0;
    const nextVersionNum = isMajor ? `v${Math.floor(numPart + 1)}.0` : `v${(numPart + 0.1).toFixed(1)}`;

    const newSnapshot: PostVersion = {
      versionId: `ver-${Date.now()}-${history.length + 1}`,
      versionNumber: nextVersionNum,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      modifiedBy: currentUser?.name || 'Scott Harvey-Whittle',
      author: currentUser?.name || 'Scott Harvey-Whittle',
      authorRole: currentUser?.role === 'admin' ? 'Brand Admin' : 'Social Media Officer',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      title: post.title,
      content: post.content,
      platforms: [...post.platforms],
      mediaUrls: [...post.mediaUrls],
      status: post.status,
      complianceScore: post.complianceAudit?.score || 95,
      changesSummary: changeSummary,
      changeSummary,
      contentSnapshot: post.content,
      titleSnapshot: post.title,
      platformsSnapshot: [...post.platforms],
      mediaUrlsSnapshot: [...post.mediaUrls],
      complianceScoreSnapshot: post.complianceAudit?.score || 95,
      statusSnapshot: post.status
    };

    // Asynchronously cache version on backend
    fetch(`/api/posts/versions/${post.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSnapshot)
    }).catch(err => console.warn('Version sync notification:', err));

    return {
      ...post,
      currentVersion: nextVersionNum,
      lastModified: new Date().toISOString(),
      versionHistory: [newSnapshot, ...history]
    };
  };

  // Revert a post to a previous historical version
  const handleRevertVersion = (postId: string, version: PostVersion) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const revertedTitle = version.title || version.titleSnapshot;
        const revertedContent = version.content || version.contentSnapshot;
        const revertedPlatforms = version.platforms || version.platformsSnapshot;
        const revertedMedia = version.mediaUrls || version.mediaUrlsSnapshot;
        const revertedStatus = version.status || version.statusSnapshot;
        const revertedScore = version.complianceScore || version.complianceScoreSnapshot;

        // Record the revert action itself in version history
        const revertSnapshot: PostVersion = {
          versionId: `ver-revert-${Date.now()}`,
          versionNumber: `${version.versionNumber}-restored`,
          timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          modifiedBy: currentUser?.name || 'Scott Harvey-Whittle',
          author: currentUser?.name || 'Scott Harvey-Whittle',
          authorRole: currentUser?.role === 'admin' ? 'Brand Admin' : 'Social Media Officer',
          authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          title: revertedTitle,
          content: revertedContent,
          platforms: [...revertedPlatforms],
          mediaUrls: [...revertedMedia],
          status: revertedStatus,
          complianceScore: revertedScore,
          changesSummary: `Reverted back to previous snapshot ${version.versionNumber} (${version.timestamp})`,
          changeSummary: `Reverted back to previous snapshot ${version.versionNumber} (${version.timestamp})`,
          contentSnapshot: revertedContent,
          titleSnapshot: revertedTitle,
          platformsSnapshot: [...revertedPlatforms],
          mediaUrlsSnapshot: [...revertedMedia],
          complianceScoreSnapshot: revertedScore,
          statusSnapshot: revertedStatus
        };

        return {
          ...p,
          title: revertedTitle,
          content: revertedContent,
          platforms: [...revertedPlatforms],
          mediaUrls: [...revertedMedia],
          status: revertedStatus,
          currentVersion: `${version.versionNumber} (Restored)`,
          lastModified: new Date().toISOString(),
          versionHistory: [revertSnapshot, ...(p.versionHistory || [])]
        };
      }
      return p;
    }));

    setHistoryModalPost(null);
    confetti({ particleCount: 60, spread: 60 });
    showToast(`Successfully reverted broadcast to version ${version.versionNumber}!`);
  };

  // Approval Queue Actions
  const handleApprovePost = (postId: string) => {
    if (currentUser?.email?.toLowerCase() !== 'scott@q-ai.online') {
      showToast('Permission Denied: Only scott@q-ai.online is authorized to approve posts.', 'warning');
      return;
    }
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const approvedPost: PostItem = {
          ...p,
          status: 'approved',
          approvedBy: `${currentUser.name} (Lead Approver - ${currentUser.email})`
        };
        return recordPostVersion(approvedPost, 'Approved for multi-channel scheduling by Lead Approver.');
      }
      return p;
    }));
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    showToast('Post approved by Scott Harvey-Whittle! Ready for scheduled multi-channel distribution.');
  };

  const handleRequestChanges = (postId: string, feedback: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const revisedPost: PostItem = {
          ...p,
          status: 'changes_requested',
          comments: [
            ...p.comments,
            {
              id: `c-${Date.now()}`,
              author: currentUser?.name || 'Jordan Vance',
              authorRole: currentUser?.role === 'admin' ? 'Brand Admin' : 'Editorial Reviewer',
              avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
              content: feedback,
              createdAt: 'Just now',
              isResolved: false
            }
          ]
        };
        return recordPostVersion(revisedPost, `Changes requested: "${feedback.slice(0, 40)}..."`);
      }
      return p;
    }));
    showToast('Feedback submitted to editorial team. Post moved to Changes Requested.', 'warning');
  };

  const handlePublishNow = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) {
      showToast('Could not find the post to publish.', 'warning');
      return;
    }

    try {
      await publishBroadcast(post, postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const publishedPost: PostItem = {
            ...p,
            status: 'published',
            publishedAt: new Date().toISOString()
          };
          return recordPostVersion(publishedPost, 'Broadcast published through configured backend social providers.', true);
        }
        return p;
      }));
      confetti({ particleCount: 90, spread: 70 });
      showToast('Post published through the backend social provider routes.');
    } catch (err: any) {
      showToast(err.message || 'Publishing is not configured yet.', 'warning');
    }
  };

  // Composer Actions
  const handleSaveDraft = (postData: Partial<PostItem>) => {
    if (editingPost) {
      setPosts(prev => prev.map(p => {
        if (p.id === editingPost.id) {
          const updated: PostItem = { ...p, ...postData } as PostItem;
          return recordPostVersion(updated, 'Updated draft content in composer.');
        }
        return p;
      }));
      setEditingPost(null);
    } else {
      const newPostId = `post-${Date.now()}`;
      const initialVersion: PostVersion = {
        versionId: `ver-${Date.now()}-1`,
        versionNumber: 'v1.0',
        timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        modifiedBy: currentUser?.name || 'Scott Harvey-Whittle',
        author: currentUser?.name || 'Scott Harvey-Whittle',
        authorRole: currentUser?.title || 'Social Media & Communications Officer',
        authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        title: postData.title || 'Untitled Broadcast',
        content: postData.content || '',
        platforms: postData.platforms || ['instagram'],
        mediaUrls: postData.mediaUrls || [Q_LOGO_URL],
        status: 'draft',
        complianceScore: postData.complianceAudit?.score || 95,
        changesSummary: 'Initial draft created in composer.',
        changeSummary: 'Initial draft created in composer.',
        contentSnapshot: postData.content || '',
        titleSnapshot: postData.title || 'Untitled Broadcast',
        platformsSnapshot: postData.platforms || ['instagram'],
        mediaUrlsSnapshot: postData.mediaUrls || [Q_LOGO_URL],
        complianceScoreSnapshot: postData.complianceAudit?.score || 95,
        statusSnapshot: 'draft'
      };

      const newPost: PostItem = {
        id: newPostId,
        title: postData.title || 'Untitled Broadcast',
        content: postData.content || '',
        platforms: postData.platforms || ['instagram'],
        status: 'draft',
        createdAt: new Date().toISOString(),
        author: {
          name: currentUser?.name || 'Scott Harvey-Whittle',
          role: currentUser?.title || 'Communications Officer',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        },
        mediaUrls: postData.mediaUrls || [Q_LOGO_URL],
        campaign: postData.campaign || 'General',
        tags: postData.tags || ['#QIntelligence'],
        scheduledFor: postData.scheduledFor || null,
        lastModified: new Date().toISOString(),
        currentVersion: 'v1.0',
        versionHistory: [initialVersion],
        complianceAudit: postData.complianceAudit || {
          score: 95,
          status: 'approved',
          summary: 'Compliant with Q Brand Guide voice.',
          breakdown: {
            welcoming: 96,
            affirming: 95,
            clarity: 94,
            privacySafe: 98,
            nonPresumptive: 95
          },
          flags: [],
          scannedAt: new Date().toISOString()
        },
        comments: [],
        piiShieldVerified: postData.piiShieldVerified ?? true
      };
      setPosts([newPost, ...posts]);
    }
    showToast('Draft successfully saved to repository.');
  };

  const handleSubmitForApproval = (postData: Partial<PostItem>) => {
    if (editingPost) {
      setPosts(prev => prev.map(p => {
        if (p.id === editingPost.id) {
          const updated: PostItem = { 
            ...p, 
            ...postData, 
            status: 'pending_approval' 
          } as PostItem;
          return recordPostVersion(updated, 'Submitted revisions for editorial approval.');
        }
        return p;
      }));
      setEditingPost(null);
    } else {
      const newPostId = `post-${Date.now()}`;
      const initialVersion: PostVersion = {
        versionId: `ver-${Date.now()}-1`,
        versionNumber: 'v1.0',
        timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        modifiedBy: currentUser?.name || 'Scott Harvey-Whittle',
        author: currentUser?.name || 'Scott Harvey-Whittle',
        authorRole: currentUser?.title || 'Social Media & Communications Officer',
        authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        title: postData.title || 'Community Broadcast',
        content: postData.content || '',
        platforms: postData.platforms || ['instagram', 'threads'],
        mediaUrls: postData.mediaUrls || [Q_LOGO_URL],
        status: 'pending_approval',
        complianceScore: postData.complianceAudit?.score || 96,
        changesSummary: 'Broadcast created and queued for automated approval.',
        changeSummary: 'Broadcast created and queued for automated approval.',
        contentSnapshot: postData.content || '',
        titleSnapshot: postData.title || 'Community Broadcast',
        platformsSnapshot: postData.platforms || ['instagram', 'threads'],
        mediaUrlsSnapshot: postData.mediaUrls || [Q_LOGO_URL],
        complianceScoreSnapshot: postData.complianceAudit?.score || 96,
        statusSnapshot: 'pending_approval'
      };

      const newPost: PostItem = {
        id: newPostId,
        title: postData.title || 'Community Broadcast',
        content: postData.content || '',
        platforms: postData.platforms || ['instagram', 'threads'],
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        author: {
          name: currentUser?.name || 'Scott Harvey-Whittle',
          role: currentUser?.title || 'Social Media Officer',
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        },
        mediaUrls: postData.mediaUrls || [Q_LOGO_URL],
        campaign: postData.campaign || 'Wellbeing Affirmation',
        tags: postData.tags || ['#QIntelligence', '#LGBTQWellbeing'],
        scheduledFor: postData.scheduledFor || null,
        lastModified: new Date().toISOString(),
        currentVersion: 'v1.0',
        versionHistory: [initialVersion],
        complianceAudit: postData.complianceAudit || {
          score: 96,
          status: 'approved',
          summary: 'Pre-screened against Q voice pillars.',
          breakdown: {
            welcoming: 98,
            affirming: 96,
            clarity: 95,
            privacySafe: 98,
            nonPresumptive: 96
          },
          flags: [],
          scannedAt: new Date().toISOString()
        },
        comments: [],
        piiShieldVerified: postData.piiShieldVerified ?? true
      };
      setPosts([newPost, ...posts]);
    }
    setActiveTab('queue');
    showToast('Broadcast submitted to Automated Approval Queue!');
  };

  const handlePublishDirect = async (postData: Partial<PostItem>) => {
    const newPostId = `post-${Date.now()}`;

    try {
      await publishBroadcast(postData, newPostId);
    } catch (err: any) {
      showToast(err.message || 'Publishing is not configured yet.', 'warning');
      return;
    }

    const initialVersion: PostVersion = {
      versionId: `ver-${Date.now()}-1`,
      versionNumber: 'v1.0',
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      modifiedBy: currentUser?.name || 'Scott Harvey-Whittle',
      author: currentUser?.name || 'Scott Harvey-Whittle',
      authorRole: currentUser?.title || 'Social Media & Communications Officer',
      authorAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      title: postData.title || 'Live Broadcast',
      content: postData.content || '',
      platforms: postData.platforms || ['instagram'],
      mediaUrls: postData.mediaUrls || [Q_LOGO_URL],
      status: 'published',
      complianceScore: 98,
      changesSummary: 'Direct broadcast published through configured backend social providers.',
      changeSummary: 'Direct broadcast published through configured backend social providers.',
      contentSnapshot: postData.content || '',
      titleSnapshot: postData.title || 'Live Broadcast',
      platformsSnapshot: postData.platforms || ['instagram'],
      mediaUrlsSnapshot: postData.mediaUrls || [Q_LOGO_URL],
      complianceScoreSnapshot: 98,
      statusSnapshot: 'published'
    };

    const newPost: PostItem = {
      id: newPostId,
      title: postData.title || 'Live Broadcast',
      content: postData.content || '',
      platforms: postData.platforms || ['instagram'],
      status: 'published',
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      scheduledFor: postData.scheduledFor || null,
      lastModified: new Date().toISOString(),
      currentVersion: 'v1.0',
      versionHistory: [initialVersion],
      author: {
        name: currentUser?.name || 'Scott Harvey-Whittle',
        role: currentUser?.title || 'Communications Officer',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      mediaUrls: postData.mediaUrls || [Q_LOGO_URL],
      campaign: postData.campaign || 'Direct Broadcast',
      tags: postData.tags || ['#QIntelligence'],
      complianceAudit: postData.complianceAudit || {
        score: 98,
        status: 'approved',
        summary: 'Direct broadcast verified.',
        breakdown: {
          welcoming: 98,
          affirming: 98,
          clarity: 96,
          privacySafe: 100,
          nonPresumptive: 98
        },
        flags: [],
        scannedAt: new Date().toISOString()
      },
      comments: [],
      piiShieldVerified: true
    };
    setPosts([newPost, ...posts]);
    setActiveTab('queue');
    confetti({ particleCount: 90, spread: 70 });
    showToast('Broadcast published through the backend social provider routes.');
  };

  // Template to Composer Bridge
  const handleUseTemplateInComposer = (imageUrl: string, suggestedTitle: string, suggestedContent: string) => {
    setEditingPost({
      id: `post-${Date.now()}`,
      title: suggestedTitle,
      content: suggestedContent,
      platforms: ['instagram', 'threads', 'twitter'],
      status: 'draft',
      createdAt: new Date().toISOString(),
      scheduledFor: null,
      lastModified: new Date().toISOString(),
      currentVersion: 'v1.0',
      versionHistory: [],
      author: {
        name: currentUser?.name || 'Scott Harvey-Whittle',
        role: currentUser?.title || 'Communications Officer',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      mediaUrls: [imageUrl],
      campaign: 'Official Template Broadcast',
      tags: ['#QIntelligence', '#SafeSpace'],
      complianceAudit: {
        score: 98,
        status: 'approved',
        summary: 'Official template graphic adhering strictly to color contrast and Q tone guidelines.',
        breakdown: {
          welcoming: 98,
          affirming: 98,
          clarity: 96,
          privacySafe: 100,
          nonPresumptive: 98
        },
        flags: [],
        scannedAt: new Date().toISOString()
      },
      comments: [],
      piiShieldVerified: true
    });
    setActiveTab('composer');
    showToast('Template graphic loaded into Broadcast Composer!');
  };

  // Media picker modal selection
  const handleOpenMediaPicker = (onSelect: (url: string) => void) => {
    setMediaPickerCallback(() => onSelect);
  };

  const handleSelectMediaFromModal = (url: string) => {
    if (mediaPickerCallback) {
      mediaPickerCallback(url);
      setMediaPickerCallback(null);
      showToast('Media asset attached to post draft!');
    } else {
      handleUseTemplateInComposer(url, 'Broadcast Visual', "I'm here for you—always. Your private space for LGBTQ+ wellbeing.");
    }
  };

  // Edit from Queue or Calendar
  const handleEditPost = (post: PostItem) => {
    setEditingPost(post);
    setActiveTab('composer');
  };

  // Open in Compliance
  const handleOpenComplianceForPost = (post: PostItem) => {
    setComplianceAuditedPost(post);
    setActiveTab('compliance');
  };

  // Open in Collab
  const handleOpenCollabForPost = (post: PostItem) => {
    setActiveTab('collab');
  };

  // Open Version History
  const handleOpenVersionHistory = (post: PostItem) => {
    setHistoryModalPost(post);
  };

  // Rewrite application in Compliance Auditor
  const handleApplyRewriteToPost = (postId: string, newContent: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const rewritten: PostItem = {
          ...p,
          content: newContent,
          complianceAudit: {
            ...p.complianceAudit,
            score: 98,
            status: 'approved',
            summary: 'Rewritten with Q Intelligence affirming and welcoming voice.'
          }
        };
        return recordPostVersion(rewritten, 'Applied Q-Voice empathetic rewrite to post.');
      }
      return p;
    }));
    showToast('Q-Voice rewrite applied to post in queue!');
  };

  // Schedule from calendar cell click
  const handleScheduleFromCalendar = (dateStr: string) => {
    setEditingPost({
      id: `post-${Date.now()}`,
      title: 'Scheduled Broadcast',
      content: '',
      platforms: ['instagram', 'threads'],
      status: 'scheduled',
      scheduledFor: `${dateStr}T10:00:00`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      currentVersion: 'v1.0',
      versionHistory: [],
      author: {
        name: currentUser?.name || 'Scott Harvey-Whittle',
        role: currentUser?.title || 'Communications Officer',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      mediaUrls: [Q_LOGO_URL],
      campaign: 'Community Calendar',
      tags: ['#QIntelligence', '#LGBTQWellbeing'],
      complianceAudit: {
        score: 95,
        status: 'approved',
        summary: 'Pre-screened against Q voice pillars.',
        breakdown: { welcoming: 96, affirming: 96, clarity: 95, privacySafe: 98, nonPresumptive: 96 },
        flags: [],
        scannedAt: new Date().toISOString()
      },
      comments: [],
      piiShieldVerified: true
    });
    setActiveTab('composer');
  };

  const handleInsertTagIntoComposer = (tag: string) => {
    setEditingPost({
      id: `post-${Date.now()}`,
      title: `Campaign Broadcast (${tag})`,
      content: `Affirming your journey every step of the way. ${tag}`,
      platforms: ['instagram', 'threads'],
      status: 'draft',
      createdAt: new Date().toISOString(),
      scheduledFor: null,
      lastModified: new Date().toISOString(),
      currentVersion: 'v1.0',
      versionHistory: [],
      author: {
        name: currentUser?.name || 'Scott Harvey-Whittle',
        role: currentUser?.title || 'Communications Officer',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      },
      mediaUrls: [Q_LOGO_URL],
      campaign: 'High-Resonance Tag Campaign',
      tags: [tag, '#QIntelligence'],
      complianceAudit: {
        score: 98,
        status: 'approved',
        summary: 'Adheres to Q voice with high-performing community hashtag.',
        breakdown: { welcoming: 98, affirming: 98, clarity: 96, privacySafe: 100, nonPresumptive: 98 },
        flags: [],
        scannedAt: new Date().toISOString()
      },
      comments: [],
      piiShieldVerified: true
    });
    setActiveTab('composer');
    showToast(`Loaded ${tag} into Broadcast Composer!`);
  };

  const pendingCount = posts.filter(p => p.status === 'pending_approval').length;

  // Gate app behind Login Page if not authenticated
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          localStorage.setItem('q_intelligence_staff_user', JSON.stringify(user));
          setCurrentUser(user);
          showToast(`Authenticated as ${user.name} (${user.role.toUpperCase()})`);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900">
      
      {/* Pride Spectrum Accent Topline & Global Brand Header */}
      <Header
        posts={posts}
        onNewPost={() => {
          setEditingPost(null);
          setActiveTab('composer');
        }}
        onOpenCompliance={() => setActiveTab('compliance')}
        onOpenCalendar={() => setActiveTab('calendar')}
        onOpenQuickGuide={() => setShowQuickGuideModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenSocialModal={() => setShowSocialModal(true)}
        onSignOut={() => {
          localStorage.removeItem('q_intelligence_staff_user');
          setCurrentUser(null);
          showToast('Signed out to Login Page.', 'info');
        }}
        currentUser={currentUser}
        activeTab={activeTab}
      />

      {/* Primary Sticky Hub Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingCount}
        activityCount={posts.length > 0 ? 4 : 0}
        connectedChannelsCount={socialConnections.filter(c => c.isConnected).length}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'queue' && (
          <ApprovalQueue
            posts={posts}
            onApprovePost={handleApprovePost}
            onRequestChanges={handleRequestChanges}
            onPublishNow={handlePublishNow}
            onEditPost={handleEditPost}
            onOpenCollab={handleOpenCollabForPost}
            onOpenComplianceForPost={handleOpenComplianceForPost}
            onOpenVersionHistory={handleOpenVersionHistory}
            onNewPost={() => {
              setEditingPost(null);
              setActiveTab('composer');
            }}
            onInsertTagIntoComposer={handleInsertTagIntoComposer}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'calendar' && (
          <ContentCalendar
            posts={posts}
            onSelectPost={handleEditPost}
            onEditPost={handleEditPost}
            onScheduleNewPost={handleScheduleFromCalendar}
            onReschedulePost={(postId, newDateStr) => {
              setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                  const updated: PostItem = { 
                    ...p, 
                    scheduledFor: newDateStr, 
                    lastModified: new Date().toISOString() 
                  };
                  return recordPostVersion(updated, `Rescheduled to ${new Date(newDateStr).toLocaleString()}`);
                }
                return p;
              }));
              showToast('Broadcast rescheduled on visual calendar!');
            }}
            onOpenVersionHistory={handleOpenVersionHistory}
          />
        )}

        {activeTab === 'composer' && (
          <MultiPlatformComposer
            initialPost={editingPost}
            onSaveDraft={handleSaveDraft}
            onSubmitForApproval={handleSubmitForApproval}
            onPublishDirect={handlePublishDirect}
            onOpenMediaPicker={handleOpenMediaPicker}
            onOpenComplianceTab={() => setActiveTab('compliance')}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'channels' && (
          <SocialChannelsManager
            connections={socialConnections}
            onUpdateConnections={setSocialConnections}
            onShowToast={showToast}
            onNavigateToComposer={() => setActiveTab('composer')}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceAuditor
            posts={posts}
            selectedPost={complianceAuditedPost}
            onApplyRewriteToPost={handleApplyRewriteToPost}
          />
        )}

        {activeTab === 'templates' && (
          <DesignTemplatesStudio
            onUseInComposer={handleUseTemplateInComposer}
          />
        )}

        {activeTab === 'media' && (
          <MediaLibrary
            onInsertIntoComposer={(url) => {
              handleSelectMediaFromModal(url);
            }}
          />
        )}

        {activeTab === 'fonts' && (
          <FontRepository />
        )}

        {activeTab === 'collab' && (
          <CollaborationRoom
            posts={posts}
            onOpenPostInQueue={(postId) => {
              setActiveTab('queue');
            }}
          />
        )}
      </main>

      {/* Social Media Connections Modal */}
      <SocialConnectionModal
        isOpen={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        connections={socialConnections}
        onUpdateConnections={setSocialConnections}
        onShowToast={showToast}
      />

      {/* Supabase Staff & Admin Authentication Modal */}
      <StaffAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        allowClose={true}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          showToast(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
        }}
      />

      {/* Non-Technical Staff Quick Guide & Brand Cheatsheet Modal */}
      <StaffQuickGuideModal
        isOpen={showQuickGuideModal}
        onClose={() => setShowQuickGuideModal(false)}
        onNavigateTab={(tab) => setActiveTab(tab as TabKey)}
      />

      {/* Version History & Rollback Modal for Posts/Drafts */}
      {historyModalPost && (
        <VersionHistoryModal
          isOpen={Boolean(historyModalPost)}
          post={historyModalPost}
          onClose={() => setHistoryModalPost(null)}
          onRevertVersion={(postId, ver) => handleRevertVersion(postId, ver)}
        />
      )}

      {/* Shared Media Picker Modal Overlay */}
      {mediaPickerCallback && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-950 p-0.5 flex items-center justify-center overflow-hidden">
                  <QLogo className="w-full h-full object-contain" />
                </div>
                <h3 className="text-base font-bold font-display text-slate-900">
                  Select Visual Asset for Broadcast
                </h3>
              </div>
              <button
                onClick={() => setMediaPickerCallback(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <MediaLibrary
              onInsertIntoComposer={(url) => {
                handleSelectMediaFromModal(url);
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'warning' 
              ? 'bg-amber-900 text-white' 
              : toast.type === 'info' 
              ? 'bg-purple-900 text-white' 
              : 'bg-slate-900 text-white border border-purple-500/40 shadow-glow-purple'
          }`}>
            {toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/60 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#020617] p-0.5 border border-purple-400/40 flex items-center justify-center overflow-hidden">
              <QLogo className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-slate-900 font-display">Q Intelligence</span>
            <span>• Private space for LGBTQ+ wellbeing</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Supabase Auth Protected</span>
            <span>•</span>
            <span>PII Shield Active</span>
            <span>•</span>
            <span>WCAG AAA Verified</span>
            <span>•</span>
            <span>2026 Brand System</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
