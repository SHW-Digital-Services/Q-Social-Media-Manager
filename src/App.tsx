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
import { PasswordRecovery } from './components/PasswordRecovery';
import { LoginPage } from './components/LoginPage';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { StaffAuthModal } from './components/StaffAuthModal';
import { StaffQuickGuideModal } from './components/StaffQuickGuideModal';
import { QLogo } from './components/QLogo';
import { AUTHORIZED_STAFF_ACCOUNTS, StaffUser, apiFetch, getSupabaseClient } from './lib/supabase';
import { getSocialPlatformLabel } from './utils/socialOAuth';
import { postRequest } from './utils/postRequest';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [legacyDrafts,setLegacyDrafts]=useState<PostItem[]>(()=>{try{const value=JSON.parse(localStorage.getItem('q-social-posts-v1')||'[]');return Array.isArray(value)?value.filter(p=>p && !p.source && p.status!=='published' && typeof p.content==='string'):[];}catch{return [];}});
  const [recoveringDrafts,setRecoveringDrafts]=useState(false);
  const [queueError, setQueueError] = useState('');
  const [passwordRecovery,setPasswordRecovery]=useState(window.location.hash.includes('type=recovery'));
  const [authLoading, setAuthLoading] = useState(true);
  const [platformPosts, setPlatformPosts] = useState<PostItem[]>([]);
  const [platformReadError, setPlatformReadError] = useState('');
  useEffect(() => {
    if(!currentUser)return;
    let active = true;
    const load = async () => {
      try {
        const response = await apiFetch('/api/social/posts', { cache: 'no-store' });
        if (!response.ok) throw new Error('Platform posts could not be loaded.');
        const data = await response.json();
        if (active) { setPlatformPosts(data.posts || []); setPlatformReadError((data.errors || []).join(' ')); }
      } catch (error) { if (active) setPlatformReadError((error as Error).message); }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => { active = false; clearInterval(timer); };
  }, [currentUser?.id]);
  const visiblePosts = [...posts.map(local => {
    const remote = platformPosts.find(p => p.remoteIds?.some(id => local.remoteIds?.includes(id)));
    return remote ? { ...local, engagement: remote.engagement } : local;
  }), ...platformPosts.filter(remote => !posts.some(local => local.remoteIds?.includes(remote.remoteIds?.[0] || remote.id)))];
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [complianceAuditedPost, setComplianceAuditedPost] = useState<PostItem | null>(null);

  // Social Media Connections state
  const [socialConnections, setSocialConnections] = useState<SocialAccountConnection[]>(INITIAL_SOCIAL_CONNECTIONS);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);


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

  useEffect(() => {
    if(!currentUser)return;
    const params = new URLSearchParams(window.location.search);
    const isOAuthReturn = params.get('oauth') === 'success';
    let active = true;

    const connectedPlatform = params.get('platform');

    apiFetch('/api/social/status', { cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Connection status unavailable.'); return response.json(); })
      .then(status => {
        if (!active) return;
        const statuses = status.platforms || [];
        setSocialConnections(previous => previous.map(connection => {
          const saved = statuses.find((item: { platform: string }) => item.platform === connection.platform);
          if (!saved) return connection;
          return {
            ...connection,
            isConnected: Boolean(saved.hasStoredToken),
            connectedAt: saved.connectedAt,
            tokenExpiresAt: saved.tokenExpiresAt,
            accountHandle: saved.accountHandle ? (connection.platform === 'bluesky' ? `@${saved.accountHandle}` : saved.accountHandle) : connection.accountHandle,
            apiHealth: saved.hasStoredToken ? 'healthy' : 'disconnected',
            webhookActive: false,
          };
        }));
        if (isOAuthReturn) {
          const verified = statuses.some((item: { platform: string; hasStoredToken: boolean }) => item.platform === connectedPlatform && item.hasStoredToken);
          showToast(verified ? `${getSocialPlatformLabel(connectedPlatform || '')} connected.` : 'Authorization completed, but the saved login could not be verified.', verified ? 'success' : 'warning');
        }
      })
      .catch(() => { if (active && isOAuthReturn) showToast('Connection status could not be loaded.', 'warning'); })
      .finally(() => {
        if (active && isOAuthReturn) window.history.replaceState({}, document.title, window.location.pathname);
      });
    return () => { active = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    const client=getSupabaseClient();let active=true;
    const check=async()=>{
      try {
        const response=await apiFetch('/api/auth/session',{method:'POST'});
        const data=await response.json();if(active)setCurrentUser(response.ok?data.user:null);
      }catch{if(active)setCurrentUser(null);}
      finally{if(active)setAuthLoading(false);}
    };
    check();
    const subscription=client?.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setPasswordRecovery(true);setTimeout(check,0);}).data.subscription;
    return()=>{active=false;subscription?.unsubscribe();};
  }, []);
  const acceptPost=(post:PostItem)=>setPosts(previous=>[post,...previous.filter(p=>p.id!==post.id)]);
  useEffect(()=>{
    if(!currentUser){setPosts([]);setPlatformPosts([]);return;}
    let active=true;
    const load=async()=>{try{const response=await apiFetch('/api/posts');const data=await response.json();if(!response.ok)throw new Error(data.error);if(active){setPosts(data.posts);setLegacyDrafts(previous=>previous.filter(draft=>!data.posts.some((p:PostItem)=>p.id===`recovered-${draft.id}`.slice(0,100))));setQueueError('');}}catch(error){if(active)setQueueError((error as Error).message);}};
    load();const timer=setInterval(load,30000);return()=>{active=false;clearInterval(timer);};
  },[currentUser?.id]);
  const savePost=async(data:Partial<PostItem>,action:string,existing?:PostItem|null):Promise<PostItem>=>{
    const id=existing?.id||data.id||crypto.randomUUID();
    const response=await apiFetch(`/api/posts/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(postRequest(data,action,existing?.revision||0))});
    const result=await response.json();if(!response.ok)throw new Error(result.error);acceptPost(result.post);return result.post;
  };
  const recoverLegacyDrafts=async()=>{
    setRecoveringDrafts(true);try{for(const draft of legacyDrafts){await savePost({...draft,id:`recovered-${draft.id}`.slice(0,100),platforms:draft.platforms.filter(p=>['facebook','bluesky','website'].includes(p)),tags:draft.tags||[],mediaUrls:draft.mediaUrls||[]},'draft');setLegacyDrafts(previous=>previous.filter(p=>p.id!==draft.id));}showToast('Recovered browser posts as shared drafts for review.');}catch(error){showToast((error as Error).message,'warning');}finally{setRecoveringDrafts(false);}
  };
  const scheduleSaved=async(post:PostItem,instant=false,date=post.scheduledFor)=>{
    const response=await apiFetch(`/api/posts/${post.id}/schedule`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:post.revision,scheduledFor:date,instant})});
    const data=await response.json();if(!response.ok)throw new Error(data.error);acceptPost(data.post);return data.post as PostItem;
  };
  const handleSaveDraft=async(data:Partial<PostItem>)=>{
    await savePost(data,'draft',editingPost);setEditingPost(null);setActiveTab('queue');showToast('Draft saved to the shared queue.');
  };
  const handleDeleteDraft = async () => {
    if (editingPost?.revision) {
      const response = await apiFetch(`/api/posts/${editingPost.id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision: editingPost.revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The draft could not be deleted.');
      setPosts(previous => previous.filter(post => post.id !== editingPost.id));
    }
    const draftKey = `q-social-composer-v2:${currentUser?.id}:${editingPost?.id || 'new'}`;
    try { localStorage.removeItem(draftKey); } catch { /* Shared deletion has already succeeded. */ }
    setEditingPost(null);
    setActiveTab('queue');
    showToast('Draft deleted.');
  };
  const handleSubmitForApproval=async(data:Partial<PostItem>)=>{
    await savePost(data,'submit',editingPost);setEditingPost(null);setActiveTab('queue');showToast('Post saved and submitted for approval.');
  };
  const composerDelivery=async(data:Partial<PostItem>,instant:boolean)=>{
    let post=await savePost(data,'submit',editingPost);
    post=await savePost(post,'approve',post);
    post=await scheduleSaved(post,instant);setEditingPost(null);setActiveTab(instant?'queue':'calendar');
    const failed=post.deliveryStates?.some(d=>d.state==='failed'||d.state==='uncertain');
    showToast(failed?'Delivery needs attention. Check the queue for the platform result.':instant?'Delivery processed. Check the queue for results.':'Post saved to the publishing schedule.',failed?'warning':'success');
  };
  const handleSchedulePost=(data:Partial<PostItem>)=>composerDelivery(data,false);
  const handlePublishDirect=(data:Partial<PostItem>)=>composerDelivery(data,true);
  const handleApprovePost=async(id:string)=>{
    try{const post=posts.find(p=>p.id===id);if(!post)return;const approved=await savePost(post,'approve',post);if(approved.scheduledFor && new Date(approved.scheduledFor).getTime()>Date.now()+60000){await scheduleSaved(approved);showToast('Post approved and scheduled.');}else showToast('Post approved and ready to publish.');}
    catch(error){showToast((error as Error).message,'warning');}
  };
  const handleRequestChanges=async(id:string,feedback:string)=>{
    try{const post=posts.find(p=>p.id===id);if(post)await savePost({...post,feedback},'changes',post);showToast('Change request saved.');}catch(error){showToast((error as Error).message,'warning');}
  };
  const handlePublishNow=async(id:string)=>{
    try{const post=posts.find(p=>p.id===id);if(post){const result=await scheduleSaved(post,true);showToast(result.status==='published'?'Post published.':'Delivery needs attention. Check the platform results.',result.status==='published'?'success':'warning');}}
    catch(error){showToast((error as Error).message,'warning');}
  };
  const handleCancelSchedule=async(id:string)=>{
    try{const post=posts.find(p=>p.id===id);if(!post)return;const response=await apiFetch(`/api/posts/${id}/cancel`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:post.revision})});const data=await response.json();if(!response.ok)throw new Error(data.error);acceptPost(data.post);showToast('Schedule cancelled. The post remains in the shared queue.');}
    catch(error){showToast((error as Error).message,'warning');}
  };
  const handleRevertVersion=async(id:string,version:PostVersion)=>{
    try{const post=posts.find(p=>p.id===id);if(!post)return;await savePost({...post,title:version.titleSnapshot,content:version.contentSnapshot,platforms:version.platformsSnapshot,mediaUrls:version.mediaUrlsSnapshot},'draft',post);showToast('Version restored as a draft for review.');}
    catch(error){showToast((error as Error).message,'warning');}
  };

  // Template to Composer Bridge
  const handleUseTemplateInComposer = (imageUrl: string, suggestedTitle: string, suggestedContent: string) => {
    setEditingPost({
      id: `post-${Date.now()}`,
      title: suggestedTitle,
      content: suggestedContent,
      platforms: ['facebook'],
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
    if (post.source === 'platform' || post.status === 'scheduled' || post.status === 'published') { showToast('This post was synced from the platform. Cancel its schedule before editing, or manage published posts on the social platform.', 'info'); return; }
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
  const handleApplyRewriteToPost=async(id:string,content:string)=>{
    try{const post=posts.find(p=>p.id===id);if(post)await savePost({...post,content},'draft',post);showToast('Rewrite saved as a draft for review.');}catch(error){showToast((error as Error).message,'warning');}
  };

  // Schedule from calendar cell click
  const handleScheduleFromCalendar = (dateStr: string) => {
    setEditingPost({
      id: `post-${Date.now()}`,
      title: 'Scheduled Broadcast',
      content: '',
      platforms: ['facebook'],
      status: 'draft',
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
      platforms: ['facebook'],
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

  const handleReschedulePost=async(id:string,date:string)=>{
    const post=posts.find(p=>p.id===id);if(!post)return;
    try{
      if(post.status==='scheduled'||post.status==='approved')await scheduleSaved(post,false,date);
      else await savePost({...post,scheduledFor:date},post.status==='pending_approval'?'submit':'draft',post);
      showToast('Publication time saved.');
    }catch(error){showToast((error as Error).message,'warning');throw error;}
  };

  const pendingCount = posts.filter(p => p.status === 'pending_approval').length;

  // Gate app behind Login Page if not authenticated
  if(passwordRecovery)return <PasswordRecovery onComplete={()=>{setPasswordRecovery(false);setCurrentUser(null);window.history.replaceState({},document.title,window.location.pathname);}} />;
  if(authLoading)return <div className="min-h-screen flex items-center justify-center">Checking your sign-in session…</div>;
  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
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
        posts={visiblePosts}
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
          apiFetch('/api/auth/logout',{method:'POST'});
          getSupabaseClient()?.auth.signOut();
          setCurrentUser(null);
          showToast('Signed out to Login Page.', 'info');
        }}
        currentUser={currentUser}
        activeTab={activeTab}
      />

      {legacyDrafts.length>0 && <aside className="p-4 bg-amber-50 text-amber-950 text-sm flex items-center justify-between gap-3"><span>{legacyDrafts.length} posts from the previous browser queue can be recovered as shared drafts.</span><button disabled={recoveringDrafts} onClick={recoverLegacyDrafts} className="font-semibold underline">{recoveringDrafts?'Recovering…':'Recover browser drafts'}</button></aside>}
      <div className="flex flex-1 flex-col lg:flex-row">
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingCount={pendingCount}
          activityCount={posts.filter(p=>p.status==='changes_requested').length}
          connectedChannelsCount={socialConnections.filter(c => c.isConnected).length}
        />

      {/* Main Workspace Stage */}
      <main className="flex-1 min-w-0 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {queueError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 text-amber-900">{queueError}</p>}
        {activeTab === 'queue' && (
          <ApprovalQueue
            platformReadError={[queueError,platformReadError].filter(Boolean).join(' ')}
            onCancelSchedule={handleCancelSchedule}
            engagementPosts={platformPosts}
            onScheduleNewPost={handleScheduleFromCalendar}
            onReschedulePost={handleReschedulePost}
            posts={visiblePosts}
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
            posts={visiblePosts}
            onSelectPost={handleEditPost}
            onEditPost={handleEditPost}
            onScheduleNewPost={handleScheduleFromCalendar}
            onReschedulePost={handleReschedulePost}
            onOpenVersionHistory={handleOpenVersionHistory}
          />
        )}

        {activeTab === 'composer' && (
          <MultiPlatformComposer key={`${currentUser.id}:${editingPost?.id || "new"}`}
            initialPost={editingPost}
            onSaveDraft={handleSaveDraft}
            onDeleteDraft={handleDeleteDraft}
            onSubmitForApproval={handleSubmitForApproval}
            onPublishDirect={handlePublishDirect}
            onSchedulePost={handleSchedulePost}
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
            posts={visiblePosts}
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
          <CollaborationRoom onPostUpdated={acceptPost}
            posts={visiblePosts}
            onOpenPostInQueue={(postId) => {
              setActiveTab('queue');
            }}
          />
        )}
      </main>
      </div>

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
            <span>Authenticated staff access</span>
            <span>•</span>
            <span>PII Shield Active</span>
            <span>•</span>
            <span>Staff workspace</span>
            <span>•</span>
            <span>2026 Brand System</span>
          </div>
        </div>
      </footer>

      {/* Vercel Web Analytics */}
      <Analytics />

    </div>
  );
}
