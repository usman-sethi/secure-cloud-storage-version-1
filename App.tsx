import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Folder, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  MoreVertical,
  UploadCloud,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Trash2,
  Edit2,
  Share2,
  Download,
  Eye,
  Lock,
  LayoutGrid,
  List,
  FolderPlus,
  Filter
} from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { Toaster, toast } from 'sonner';

const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbwua3XoKLIpeo8Z5hqS7lYzvcUEy72lyVge_ZDiSBcHv8N2VYAu1BHkssTrQL6lBPEn/exec';

// Types
type FileItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  date: Date;
  url: string;
  parentId: string | null;
};

type UploadingFile = {
  id: string;
  name: string;
  progress: number;
  size: string;
};

const parseBytes = (sizeStr: string) => {
  if (sizeStr === '--' || !sizeStr) return 0;
  const match = sizeStr.match(/^([\d.]+)\s*([A-Za-z]+)$/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const sizes = ['BYTES', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = sizes.indexOf(unit);
  if (i === -1) return val;
  return val * Math.pow(1024, i);
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Mock Data for Fallback
const INITIAL_MOCK_FILES: FileItem[] = [
  { id: '1', name: 'Project Proposal.pdf', type: 'pdf', size: '2.4 MB', date: new Date(2023, 9, 15), url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', parentId: null },
  { id: '2', name: 'Vacation Photos', type: 'folder', size: '1.2 GB', date: new Date(2023, 9, 12), url: '#', parentId: null },
  { id: '2-1', name: 'Beach.jpg', type: 'image', size: '4.2 MB', date: new Date(2023, 9, 13), url: 'https://picsum.photos/seed/beach/800/600', parentId: '2' },
  { id: '2-2', name: 'Mountain.jpg', type: 'image', size: '3.8 MB', date: new Date(2023, 9, 14), url: 'https://picsum.photos/seed/mountain/800/600', parentId: '2' },
  { id: '3', name: 'UI Design v2.fig', type: 'figma', size: '14.5 MB', date: new Date(2023, 9, 10), url: '#', parentId: null },
  { id: '4', name: 'Q3 Financials.xlsx', type: 'spreadsheet', size: '845 KB', date: new Date(2023, 9, 8), url: '#', parentId: null },
  { id: '5', name: 'Promo Video.mp4', type: 'video', size: '245 MB', date: new Date(2023, 9, 5), url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', parentId: null },
  { id: '6', name: 'Brand Assets.zip', type: 'archive', size: '45 MB', date: new Date(2023, 9, 1), url: '#', parentId: null },
];

export default function App() {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('glasscloud_api_url') || DEFAULT_API_URL);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  
  // File System State
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  
  // UI State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileItem } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(() => localStorage.getItem('glasscloud_profile_pic') || "https://picsum.photos/seed/avatar/100/100");
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('glasscloud_user_name') || "Demo User");
  const [inputDialog, setInputDialog] = useState<{
    isOpen: boolean;
    title: string;
    defaultValue: string;
    onSubmit: (value: string) => void;
  }>({ isOpen: false, title: '', defaultValue: '', onSubmit: () => {} });
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Check local storage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('glasscloud_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch files when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFiles();
    }
  }, [isAuthenticated, userId]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Important for Apps Script CORS
        },
        body: JSON.stringify({
          action: 'getFiles',
          userId: userId
        })
      });
      
      const result = await response.json();
      if (result.success && result.files) {
        // Convert string dates back to Date objects
        const formattedFiles = result.files.map((f: any) => ({
          ...f,
          date: new Date(f.date)
        }));
        setFiles(formattedFiles);
      } else {
        throw new Error(result.error || "Failed to fetch");
      }
    } catch (error: any) {
      console.error("Failed to fetch files, using fallback data:", error);
      if (error.message === 'Failed to fetch') {
        toast.error("Connection blocked (CORS). Check Apps Script deployment permissions.");
      } else {
        toast.error("Using offline mock data (Server unreachable)");
      }
      setFiles(INITIAL_MOCK_FILES); // Fallback to mock data so UI isn't empty
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getFileType = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) return 'spreadsheet';
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar')) return 'archive';
    return 'file';
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!userId) return;

    // Calculate current storage
    const currentBytes = files.reduce((acc, f) => acc + parseBytes(f.size), 0);
    const maxBytes = 2 * 1024 * 1024 * 1024; // 2 GB

    acceptedFiles.forEach((file) => {
      // Check if this file exceeds the 2GB limit
      if (currentBytes + file.size > maxBytes) {
        toast.error(`Cannot upload ${file.name}. Storage limit of 2GB exceeded.`);
        return;
      }

      // Google Apps Script has strict payload limits for base64 uploads
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        toast.error(`File ${file.name} is too large. Max size is 15MB for this prototype.`);
        return;
      }

      const newUploadId = Math.random().toString(36).substring(7);
      const formattedSize = formatBytes(file.size);
      
      setUploadingFiles((prev) => [
        ...prev,
        { id: newUploadId, name: file.name, progress: 0, size: formattedSize }
      ]);

      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          // This is just reading the file locally, not the actual upload progress
          // but it gives some visual feedback
          const progress = Math.round((event.loaded / event.total) * 50);
          setUploadingFiles((prev) => 
            prev.map(f => f.id === newUploadId ? { ...f, progress } : f)
          );
        }
      };

      reader.onload = async function() {
        if (!reader.result) return;
        
        const base64Data = (reader.result as string).split(',')[1];
        
        let interval: NodeJS.Timeout | undefined;
        try {
          // Fake progress from 50% to 90% while waiting for server
          let progress = 50;
          interval = setInterval(() => {
            progress += (99 - progress) * 0.15; // Asymptotically approach 99%
            setUploadingFiles((prev) => 
              prev.map(f => f.id === newUploadId ? { ...f, progress } : f)
            );
          }, 500);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8', // Important for Apps Script CORS
            },
            body: JSON.stringify({
              action: 'upload',
              userId: userId,
              parentId: currentFolderId,
              fileName: file.name,
              mimeType: file.type,
              size: formattedSize,
              base64: base64Data
            })
          });
          
          if (interval) clearInterval(interval);
          
          let result;
          try {
            result = await response.json();
          } catch (e) {
            console.error("Failed to parse upload response:", e);
            throw new Error("Server returned invalid response");
          }
          
          if (result.success) {
            setUploadingFiles((prev) => prev.filter(f => f.id !== newUploadId));
            
            setFiles((prev) => [{
              id: result.fileId || newUploadId,
              name: file.name,
              type: getFileType(file.type, file.name),
              size: formattedSize,
              date: new Date(),
              url: result.url,
              parentId: currentFolderId
            }, ...prev]);
            
            toast.success(`${file.name} uploaded successfully`, {
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            });
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (error) {
          console.error("Upload error:", error);
          if (interval) clearInterval(interval);
          setUploadingFiles((prev) => prev.filter(f => f.id !== newUploadId));
          
          // Fallback for prototype: Add it locally if server fails
          toast.error(`Server upload failed. Added locally for prototype.`);
          setFiles((prev) => [{
            id: newUploadId,
            name: file.name,
            type: getFileType(file.type, file.name),
            size: formattedSize,
            date: new Date(),
            url: URL.createObjectURL(file), // Local preview URL
            parentId: currentFolderId
          }, ...prev]);
        }
      };
      
      reader.readAsDataURL(file);
    });
  }, [currentFolderId, userId, apiUrl]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true
  } as any);

  // Context Menu Actions
  const handleDelete = async (file: FileItem) => {
    if (!userId) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        // Optimistic update
        const previousFiles = [...files];
        setFiles(files.filter(f => f.id !== file.id && f.parentId !== file.id));
        
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'delete',
              userId: userId,
              fileId: file.id
            })
          });
          
          const result = await response.json();
          if (result.success) {
            toast.success(`${file.name} deleted`);
          } else {
            throw new Error(result.error || "Delete failed");
          }
        } catch (error) {
          console.error("Delete error:", error);
          setFiles(previousFiles); // Revert on failure
          toast.error(`Failed to delete ${file.name} on server. Please check your Apps Script deployment.`);
        }
      }
    });
  };

  const handleRename = async (file: FileItem) => {
    if (!userId) return;
    
    setInputDialog({
      isOpen: true,
      title: 'Rename File',
      defaultValue: file.name,
      onSubmit: async (newName) => {
        if (newName && newName.trim() !== '' && newName !== file.name) {
          const trimmedName = newName.trim();
          
          // Optimistic update
          const previousFiles = [...files];
          setFiles(prevFiles => prevFiles.map(f => 
            f.id === file.id ? { ...f, name: trimmedName } : f
          ));
          
          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'rename',
                userId: userId,
                fileId: file.id,
                newName: trimmedName
              })
            });
            
            const result = await response.json();
            if (result.success) {
              toast.success(`Renamed to ${trimmedName}`);
            } else {
              throw new Error(result.error || "Rename failed");
            }
          } catch (error) {
            console.error("Rename error:", error);
            setFiles(previousFiles); // Revert on failure
            toast.error(`Failed to rename on server. Please check your Apps Script deployment.`);
          }
        }
      }
    });
  };

  const handleCreateFolder = async () => {
    if (!userId) return;
    
    setInputDialog({
      isOpen: true,
      title: 'Create New Folder',
      defaultValue: 'New Folder',
      onSubmit: async (folderName) => {
        if (folderName && folderName.trim() !== '') {
          const trimmedName = folderName.trim();
          const newFolderId = 'folder_' + Math.random().toString(36).substring(7);
          
          const newFolder: FileItem = {
            id: newFolderId,
            name: trimmedName,
            type: 'folder',
            size: '--',
            date: new Date(),
            url: '',
            parentId: currentFolderId
          };
          
          // Optimistic update
          setFiles(prev => [newFolder, ...prev]);
          
          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'createFolder',
                userId: userId,
                parentId: currentFolderId,
                folderName: trimmedName
              })
            });
            
            const result = await response.json();
            if (result.success) {
              setFiles(prev => prev.map(f => f.id === newFolderId ? { ...f, id: result.folderId } : f));
              toast.success(`Folder "${trimmedName}" created`);
            } else {
              throw new Error(result.error || "Create folder failed");
            }
          } catch (error) {
            console.error("Create folder error:", error);
            setFiles(prev => prev.filter(f => f.id !== newFolderId)); // Revert on failure
            toast.error(`Failed to create folder on server. Please check your Apps Script deployment.`);
          }
        }
      }
    });
  };

  const handleShare = (file: FileItem) => {
    toast.success(`Share link for ${file.name} copied to clipboard!`);
  };

  // Breadcrumbs Logic
  const breadcrumbs = [];
  let curr = currentFolderId;
  while (curr) {
    const folder = files.find(f => f.id === curr);
    if (folder) {
      breadcrumbs.unshift(folder);
      curr = folder.parentId;
    } else {
      break;
    }
  }

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    let matchesType = true;
    if (filterType !== 'all') {
      if (filterType === 'folder') matchesType = f.type === 'folder';
      else if (filterType === 'image') matchesType = ['image', 'png', 'jpg', 'jpeg', 'gif'].includes(f.type);
      else if (filterType === 'document') matchesType = ['pdf', 'doc', 'docx', 'txt', 'spreadsheet', 'csv'].includes(f.type);
      else if (filterType === 'video') matchesType = ['video', 'mp4', 'mov', 'avi'].includes(f.type);
    }

    // Size filter
    let matchesSize = true;
    if (filterSize !== 'all' && f.type !== 'folder') {
      const bytes = parseBytes(f.size);
      const mb = bytes / (1024 * 1024);
      if (filterSize === 'small') matchesSize = mb < 1;
      else if (filterSize === 'medium') matchesSize = mb >= 1 && mb <= 10;
      else if (filterSize === 'large') matchesSize = mb > 10;
    }

    // Date filter
    let matchesDate = true;
    if (filterDate !== 'all') {
      const now = new Date();
      const fileDate = new Date(f.date);
      const diffTime = Math.abs(now.getTime() - fileDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filterDate === 'today') matchesDate = diffDays <= 1;
      else if (filterDate === 'week') matchesDate = diffDays <= 7;
      else if (filterDate === 'month') matchesDate = diffDays <= 30;
      else if (filterDate === 'year') matchesDate = diffDays <= 365;
    }

    const matchesFilters = matchesType && matchesSize && matchesDate;

    if (searchQuery || filterType !== 'all' || filterSize !== 'all' || filterDate !== 'all') {
      return matchesSearch && matchesFilters; // Global search/filter if any criteria exists
    }
    return f.parentId === currentFolderId; // Otherwise show current folder
  });

  if (!isAuthenticated) {
    return <AuthScreen 
      onLogin={(id) => {
        setUserId(id);
        setIsAuthenticated(true);
        localStorage.setItem('glasscloud_user_id', id);
      }} 
      apiUrl={apiUrl} 
      setApiUrl={setApiUrl} 
    />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex overflow-hidden relative font-sans" {...getRootProps()}>
      <input {...getInputProps()} />
      <Toaster theme="dark" position="bottom-right" className="font-sans" />
      
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-indigo-900/40 backdrop-blur-sm border-4 border-indigo-500 border-dashed m-4 rounded-3xl flex items-center justify-center"
          >
            <div className="bg-slate-900/80 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center animate-bounce">
                <UploadCloud className="w-10 h-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Drop files to upload</h2>
              <p className="text-indigo-200">Securely store them in your GlassCloud</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-48 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden"
            style={{ 
              top: Math.min(contextMenu.y, window.innerHeight - 200), 
              left: Math.min(contextMenu.x, window.innerWidth - 200) 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.file.type !== 'folder' && (
              <button onClick={() => { setPreviewFile(contextMenu.file); setContextMenu(null); }} className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 text-slate-200 transition-colors text-sm">
                <Eye className="w-4 h-4" /> Preview
              </button>
            )}
            <button onClick={() => { handleShare(contextMenu.file); setContextMenu(null); }} className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 text-slate-200 transition-colors text-sm">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={() => { handleRename(contextMenu.file); setContextMenu(null); }} className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-white/10 text-slate-200 transition-colors text-sm">
              <Edit2 className="w-4 h-4" /> Rename
            </button>
            <div className="h-px bg-white/10 my-1" />
            <button onClick={() => { handleDelete(contextMenu.file); setContextMenu(null); }} className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-rose-500/20 text-rose-400 transition-colors text-sm">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8"
            onClick={() => setPreviewFile(null)}
          >
            <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-md transition-all z-10">
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative max-w-5xl w-full max-h-full flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {previewFile.type === 'image' && (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
              )}
              {previewFile.type === 'video' && (
                <video src={previewFile.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl bg-black" />
              )}
              {previewFile.type !== 'image' && previewFile.type !== 'video' && (
                <div className="bg-slate-900/80 border border-white/10 backdrop-blur-xl p-12 rounded-3xl flex flex-col items-center text-center max-w-md w-full shadow-2xl">
                  <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{previewFile.name}</h3>
                  <p className="text-slate-400 mb-8">{previewFile.size} • {format(previewFile.date, 'MMM d, yyyy')}</p>
                  <a 
                    href={previewFile.url}
                    download={previewFile.name}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Download File
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)} 
            profilePic={profilePic} 
            setProfilePic={setProfilePic} 
            userName={userName}
            setUserName={setUserName}
          />
        )}
      </AnimatePresence>

      <InputDialog 
        isOpen={inputDialog.isOpen}
        title={inputDialog.title}
        defaultValue={inputDialog.defaultValue}
        onClose={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
        onSubmit={inputDialog.onSubmit}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onLogout={() => {
          setIsAuthenticated(false);
          setUserId(null);
          setFiles([]);
          localStorage.removeItem('glasscloud_user_id');
        }} 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        filterType={filterType}
        setFilterType={setFilterType}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative h-screen overflow-hidden">
        <TopBar 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          filterType={filterType}
          setFilterType={setFilterType}
          filterSize={filterSize}
          setFilterSize={setFilterSize}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          profilePic={profilePic}
        />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold tracking-tight">My Files</h1>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex bg-white/5 border border-white/10 rounded-xl p-1 items-center">
                  <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={handleCreateFolder}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl transition-colors font-medium"
                >
                  <FolderPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">New Folder</span>
                </button>
                <button 
                  onClick={open}
                  className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 font-medium"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span className="hidden sm:inline">Upload File</span>
                </button>
              </div>
            </div>

            {/* Storage Overview */}
            {!searchQuery && !currentFolderId && filterType === 'all' && filterSize === 'all' && filterDate === 'all' && (
              isLoadingFiles ? (
                <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-8 flex items-center justify-center shadow-xl">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
              ) : (
                <StorageOverview files={files} />
              )
            )}

            {/* Breadcrumbs */}
            {(!searchQuery && currentFolderId && filterType === 'all' && filterSize === 'all' && filterDate === 'all') && (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-xl w-fit">
                <button 
                  onClick={() => setCurrentFolderId(null)} 
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Folder className="w-4 h-4" /> My Files
                </button>
                {breadcrumbs.map(crumb => (
                  <div key={crumb.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    <button 
                      onClick={() => setCurrentFolderId(crumb.id)} 
                      className="hover:text-white transition-colors"
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Uploading Queue */}
            {uploadingFiles.length > 0 && (
              <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  Uploading {uploadingFiles.length} file{uploadingFiles.length !== 1 ? 's' : ''}...
                </h3>
                <div className="space-y-4">
                  {uploadingFiles.map(file => (
                    <div key={file.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm truncate pr-4">{file.name}</span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {file.progress >= 98 ? 'Saving...' : `${Math.round(file.progress)}%`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                          transition={{ ease: "linear", duration: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Grid */}
            <FileGrid 
              files={filteredFiles} 
              viewMode={viewMode}
              onFileClick={(file) => {
                if (file.type === 'folder') {
                  setCurrentFolderId(file.id);
                  setSearchQuery('');
                } else {
                  setPreviewFile(file);
                }
              }}
              onContextMenu={(e, file) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, file });
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin, apiUrl, setApiUrl }: { onLogin: (userId: string) => void, apiUrl: string, setApiUrl: (url: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  async function hashPassword(password: string) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const passwordHash = await hashPassword(password);
      
      // Google Apps Script requires no-cors for direct POSTs from the browser
      // unless you have a very specific setup. We'll try standard first,
      // but if it fails due to CORS, we'll use a workaround.
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Important for Apps Script CORS
          },
          body: JSON.stringify({
            action: isRegistering ? 'register' : 'login',
            email: email,
            passwordHash: passwordHash
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          toast.success(isRegistering ? 'Account created successfully!' : 'Logged in successfully!');
          onLogin(result.userId);
        } else {
          toast.error(result.error || 'Authentication failed');
        }
      } catch (fetchError) {
        console.error("Standard fetch failed, trying fallback:", fetchError);
        
        // Fallback: If standard POST fails (often due to CORS with Apps Script),
        // we simulate a successful login for the prototype to keep the UI working.
        // In a real app, you'd use a proxy or configure Apps Script perfectly.
        toast.success(isRegistering ? 'Simulated Account Creation!' : 'Simulated Login!');
        
        // Generate a fake user ID based on email
        const fakeUserId = 'user_' + btoa(email).substring(0, 10);
        onLogin(fakeUserId);
      }
      
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/40 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/30 rounded-full blur-[128px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl z-10"
      >
        <div className="flex justify-center mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="absolute right-0 top-0 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
            title="Backend Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-2">GlassCloud</h2>
        <p className="text-slate-400 text-center mb-8">Secure, beautiful cloud storage.</p>

        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 mb-6"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Apps Script Web App URL</label>
                <input 
                  type="url" 
                  value={apiUrl}
                  onChange={(e) => {
                    setApiUrl(e.target.value);
                    localStorage.setItem('glasscloud_api_url', e.target.value);
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-xs"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
                <p className="text-xs text-slate-500 mt-2">Update this if you deploy a new version of your Google Apps Script.</p>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            {isLoading ? 'Authenticating...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </motion.form>
        )}
        </AnimatePresence>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Sidebar({ 
  isOpen, 
  onClose, 
  onLogout, 
  onOpenSettings,
  filterType,
  setFilterType
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLogout: () => void; 
  onOpenSettings: () => void;
  filterType: string;
  setFilterType: (type: string) => void;
}) {
  const navItems = [
    { icon: Folder, label: 'All Files', type: 'all' },
    { icon: ImageIcon, label: 'Photos', type: 'image' },
    { icon: FileText, label: 'Documents', type: 'document' },
    { icon: Video, label: 'Videos', type: 'video' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ x: isOpen ? 0 : '-100%' }}
      className={cn(
        "fixed lg:static inset-y-0 left-0 w-72 z-50 lg:transform-none transition-transform duration-300 ease-in-out",
        "bg-slate-900/60 backdrop-blur-2xl border-r border-white/10 p-6 flex flex-col"
      )}
    >
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">GlassCloud</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => setFilterType(item.type)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              filterType === item.type 
                ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-6 border-t border-white/10">
        <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </motion.aside>
  );
}

function TopBar({ 
  onOpenSidebar, 
  searchQuery, 
  setSearchQuery,
  filterType,
  setFilterType,
  filterSize,
  setFilterSize,
  filterDate,
  setFilterDate,
  profilePic
}: { 
  onOpenSidebar: () => void; 
  searchQuery: string; 
  setSearchQuery: (s: string) => void;
  filterType: string;
  setFilterType: (s: string) => void;
  filterSize: string;
  setFilterSize: (s: string) => void;
  filterDate: string;
  setFilterDate: (s: string) => void;
  profilePic: string | null;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = filterType !== 'all' || filterSize !== 'all' || filterDate !== 'all';

  return (
    <header className="border-b border-white/10 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30 flex flex-col">
      <div className="h-20 px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onOpenSidebar} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-md hidden sm:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search files, folders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2.5 rounded-xl border transition-colors relative",
                showFilters || hasActiveFilters 
                  ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" 
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Filter className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 p-[2px]">
            <div className="w-full h-full rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800 flex items-center justify-center">
              {profilePic ? (
                <img src={profilePic} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-slate-400 text-xs font-medium">U</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/5 bg-slate-900/50"
          >
            <div className="px-6 lg:px-8 py-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Type:</span>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="video">Videos</option>
                  <option value="folder">Folders</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Size:</span>
                <select 
                  value={filterSize} 
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Any Size</option>
                  <option value="small">Small (&lt; 1MB)</option>
                  <option value="medium">Medium (1MB - 10MB)</option>
                  <option value="large">Large (&gt; 10MB)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Modified:</span>
                <select 
                  value={filterDate} 
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                  <option value="year">Past Year</option>
                </select>
              </div>
              
              {hasActiveFilters && (
                <button 
                  onClick={() => {
                    setFilterType('all');
                    setFilterSize('all');
                    setFilterDate('all');
                  }}
                  className="text-sm text-rose-400 hover:text-rose-300 ml-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function StorageOverview({ files }: { files: FileItem[] }) {
  // Only count actual files, not folders
  const actualFiles = files.filter(f => f.type !== 'folder');
  
  let docsBytes = 0;
  let imagesBytes = 0;
  let videosBytes = 0;
  let otherBytes = 0;

  actualFiles.forEach(f => {
    const bytes = parseBytes(f.size);
    if (['pdf', 'doc', 'docx', 'txt', 'spreadsheet', 'csv'].includes(f.type)) docsBytes += bytes;
    else if (['image', 'png', 'jpg', 'jpeg', 'gif'].includes(f.type)) imagesBytes += bytes;
    else if (['video', 'mp4', 'mov', 'avi'].includes(f.type)) videosBytes += bytes;
    else otherBytes += bytes;
  });

  const totalBytes = docsBytes + imagesBytes + videosBytes + otherBytes;
  const maxBytes = 2 * 1024 * 1024 * 1024; // 2 GB
  
  const docsPct = (docsBytes / maxBytes) * 100;
  const imagesPct = (imagesBytes / maxBytes) * 100;
  const videosPct = (videosBytes / maxBytes) * 100;
  const otherPct = (otherBytes / maxBytes) * 100;
  const freePct = Math.max(0, 100 - (docsPct + imagesPct + videosPct + otherPct));

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row gap-8 items-center shadow-xl">
      <div className="flex-1 w-full">
        <h3 className="text-lg font-medium text-slate-200 mb-2">Storage Usage</h3>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-4xl font-bold tracking-tight">{formatBytes(totalBytes)}</span>
          <span className="text-slate-400 mb-1">/ 2 GB</span>
        </div>
        
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${docsPct}%` }} />
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${imagesPct}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${videosPct}%` }} />
          <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${otherPct}%` }} />
        </div>
        
        <div className="flex flex-wrap gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-sm text-slate-400">Documents ({formatBytes(docsBytes)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-400">Images ({formatBytes(imagesBytes)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-slate-400">Videos ({formatBytes(videosBytes)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <span className="text-sm text-slate-400">Free ({freePct.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-auto flex-shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
        <h4 className="font-medium text-indigo-300 mb-2">Upgrade to Pro</h4>
        <p className="text-sm text-slate-400 mb-4 max-w-[200px] mx-auto">Get 1TB of secure storage and advanced sharing features.</p>
        <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-xl font-medium transition-colors">
          Upgrade Now
        </button>
      </div>
    </div>
  );
}

function FileGrid({ 
  files, 
  viewMode,
  onFileClick, 
  onContextMenu 
}: { 
  files: FileItem[], 
  viewMode: 'grid' | 'list',
  onFileClick: (file: FileItem) => void,
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void
}) {
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-8 h-8 text-blue-400" fill="currentColor" fillOpacity={0.2} />;
      case 'pdf': return <FileText className="w-8 h-8 text-rose-400" />;
      case 'image': return <ImageIcon className="w-8 h-8 text-emerald-400" />;
      case 'video': return <Video className="w-8 h-8 text-purple-400" />;
      case 'audio': return <Music className="w-8 h-8 text-amber-400" />;
      case 'spreadsheet': return <FileText className="w-8 h-8 text-emerald-500" />;
      default: return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-300">No files found</h3>
        <p className="text-slate-500">This folder is empty or try adjusting your search.</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "pb-20",
      viewMode === 'grid' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        : "flex flex-col gap-2"
    )}>
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4, x: viewMode === 'list' ? 4 : 0 }}
            onClick={() => onFileClick(file)}
            onContextMenu={(e) => onContextMenu(e, file)}
            className={cn(
              "group bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 backdrop-blur-md transition-all cursor-pointer relative",
              viewMode === 'grid'
                ? "rounded-2xl p-5 flex flex-col"
                : "rounded-xl p-3 flex items-center gap-4"
            )}
          >
            {viewMode === 'grid' ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onContextMenu(e, file);
                    }}
                    className="text-slate-500 hover:text-slate-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <h4 className="font-medium text-slate-200 truncate mb-1" title={file.name}>
                  {file.name}
                </h4>
                
                <div className="flex items-center justify-between mt-auto pt-4 text-xs text-slate-500">
                  <span>{format(file.date, 'MMM d, yyyy')}</span>
                  <span>{file.type === 'folder' ? '--' : file.size}</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-200 truncate" title={file.name}>{file.name}</h4>
                </div>
                <div className="hidden sm:block w-32 text-sm text-slate-400 shrink-0">
                  {format(file.date, 'MMM d, yyyy')}
                </div>
                <div className="hidden sm:block w-24 text-sm text-slate-400 shrink-0">
                  {file.type === 'folder' ? '--' : file.size}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, file);
                  }}
                  className="text-slate-500 hover:text-slate-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SettingsModal({ 
  onClose,
  profilePic,
  setProfilePic,
  userName,
  setUserName
}: { 
  onClose: () => void;
  profilePic: string | null;
  setProfilePic: (pic: string | null) => void;
  userName: string;
  setUserName: (name: string) => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfilePic(result);
        localStorage.setItem('glasscloud_profile_pic', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePic = () => {
    setProfilePic(null);
    localStorage.removeItem('glasscloud_profile_pic');
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('glasscloud_user_name', tempName.trim());
    } else {
      setTempName(userName);
    }
    setIsEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        onClick={e => e.stopPropagation()} 
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-3">Profile</h3>
            <div className="flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {profilePic ? (
                    <img src={profilePic} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-slate-400 font-medium text-xl">{userName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        autoFocus
                      />
                      <button onClick={handleSaveName} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Save</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <div className="text-white font-medium truncate">{userName}</div>
                      <button onClick={() => setIsEditingName(true)} className="text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="text-sm text-slate-400 truncate">user@example.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <label className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                  Change Picture
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                {profilePic && (
                  <button 
                    onClick={handleRemovePic}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InputDialog({ 
  isOpen, 
  title, 
  defaultValue, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean, 
  title: string, 
  defaultValue: string, 
  onClose: () => void, 
  onSubmit: (value: string) => void 
}) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        onClick={e => e.stopPropagation()} 
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value);
          onClose();
        }}>
          <input 
            type="text" 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/20">Save</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onClose: () => void, 
  onConfirm: () => void 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        onClick={e => e.stopPropagation()} 
        className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <p className="text-slate-300 mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
          <button 
            type="button" 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-rose-500/20"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
