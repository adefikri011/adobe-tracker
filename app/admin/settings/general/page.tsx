"use client";
import { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  UserCircle2,
  Globe2,
  UploadCloud,
  Trash2,
  Save,
  Check,
  ImageIcon,
  Info,
  ChevronRight,
  Loader2,
  AlertCircle,
  Type,
  Palette,
} from "lucide-react";

interface Section {
  key: string;
  title: string;
  desc: string;
  badge: string;
  badgeCls: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ElementType;
}

interface LogoData {
  preview: string | null;
  fileName: string | null;
  file?: File;
}

interface LogoCardProps {
  section: Section;
  data: LogoData;
  onChange: (key: string, file: File) => void;
  onRemove: (key: string) => void;
}

interface BrandingData {
  pageTitle: string;
  favicon: string | null;
  faviconFile?: File;
}

const SECTIONS: Section[] = [
  {
    key: "admin",
    title: "Admin Panel",
    desc: "Sidebar & header admin",
    badge: "Admin",
    badgeCls: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    Icon: ShieldCheck,
  },
  {
    key: "user",
    title: "Users Page",
    desc: "User dashboard navbar",
    badge: "Users",
    badgeCls: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    Icon: UserCircle2,
  },
  {
    key: "land",
    title: "Landing Page",
    desc: "Public navbar & footer",
    badge: "Landing",
    badgeCls: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    Icon: Globe2,
  },
];

function LogoCard({ section, data, onChange, onRemove }: LogoCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { Icon } = section;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4 transition-all duration-200 hover:border-orange-200 hover:shadow-md group">

      {/* Card Header */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${section.iconBg}`}>
          <Icon className={`w-[18px] h-[18px] ${section.iconColor}`} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{section.title}</p>
          <p className="text-[11.5px] text-slate-400 mt-0.5">{section.desc}</p>
        </div>
        <span className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${section.badgeCls}`}>
          {section.badge}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 -mx-1" />

      {/* Upload Zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="w-full h-[96px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/70 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/60 transition-all duration-200 overflow-hidden relative"
      >
        {data.preview ? (
          <img
            src={data.preview}
            alt={`Logo ${section.title}`}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 pointer-events-none">
            <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-orange-300 transition-colors" strokeWidth={1.5} />
            <span className="text-[11.5px] text-slate-400 font-medium">Click to upload</span>
          </div>
        )}
      </div>

      {/* File Picker Row */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors flex-shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Choose file
          </button>
          <span className={`text-[11.5px] truncate ${data.fileName ? "text-slate-500 font-medium" : "text-slate-400"}`}>
            {data.fileName || "Not selected"}
          </span>
        </div>

        {data.preview && (
          <button
            onClick={() => onRemove(section.key)}
            className="flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-500 transition-colors w-fit"
          >
            <Trash2 className="w-3 h-3" />
            Remove logo
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onChange(section.key, e.target.files[0]);
          }
        }}
      />
    </div>
  );
}

export default function GeneralSettingsPage() {
  const [logos, setLogos] = useState<Record<string, LogoData>>({
    admin: { preview: null, fileName: null },
    user: { preview: null, fileName: null },
    land: { preview: null, fileName: null },
  });
  const [branding, setBranding] = useState<BrandingData>({
    pageTitle: "TrackStock",
    favicon: null,
  });
  const [originalPageTitle, setOriginalPageTitle] = useState("TrackStock");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Load existing logos on mount
  useEffect(() => {
    const loadLogos = async () => {
      try {
        const res = await fetch("/api/admin/logos/upload");
        const { data } = await res.json();

        const logoMap: Record<string, LogoData> = {
          admin: { preview: null, fileName: null },
          user: { preview: null, fileName: null },
          land: { preview: null, fileName: null },
        };

        data.forEach((logo: any) => {
          logoMap[logo.sectionType] = {
            preview: logo.fileUrl,
            fileName: logo.fileName,
          };
        });

        setLogos(logoMap);
      } catch (err) {
        console.error("Failed to load logos:", err);
      }
    };

    // Load favicons
    const loadFavicon = async () => {
      try {
        const res = await fetch("/api/admin/favicon");
        const { data } = await res.json();
        
        // Load admin favicon
        const adminFavicon = data.find((f: any) => f.type === "admin");
        if (adminFavicon) {
          setBranding((prev) => ({
            ...prev,
            favicon: adminFavicon.fileUrl,
            pageTitle: adminFavicon.pageTitle || "TrackStock",
          }));
          setOriginalPageTitle(adminFavicon.pageTitle || "TrackStock");
        }
      } catch (err) {
        console.error("Failed to load favicons:", err);
      }
    };

    loadLogos();
    loadFavicon();
  }, []);

  const handleChange = (key: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogos((prev) => ({
        ...prev,
        [key]: { preview: result, fileName: file.name, file },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async (key: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/logos/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionType: key }),
      });

      if (!res.ok) throw new Error("Failed to delete logo");

      setLogos((prev) => ({
        ...prev,
        [key]: { preview: null, fileName: null },
      }));

      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete logo");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Upload only changed logos (ones that have file property)
      const sectionsToUpload = Object.entries(logos)
        .filter(([_, data]) => data.file)
        .map(([key, _]) => key);

      // Check if favicon was uploaded
      const hasFaviconUpload = !!branding.faviconFile;

      // Check if pageTitle changed
      const hasPageTitleChange = branding.pageTitle !== originalPageTitle;

      if (sectionsToUpload.length === 0 && !hasFaviconUpload && !hasPageTitleChange) {
        setError("No changes to save");
        setLoading(false);
        return;
      }

      // Upload logos
      for (const sectionKey of sectionsToUpload) {
        const logoData = logos[sectionKey];
        if (!logoData.file) continue;

        setUploading((prev) => ({ ...prev, [sectionKey]: true }));

        const formData = new FormData();
        formData.append("file", logoData.file);
        formData.append("sectionType", sectionKey);

        const res = await fetch("/api/admin/logos/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${sectionKey} logo`);

        const { data: responseData } = await res.json();

        setLogos((prev) => ({
          ...prev,
          [sectionKey]: {
            preview: responseData.fileUrl,
            fileName: responseData.fileName,
          },
        }));

        setUploading((prev) => ({ ...prev, [sectionKey]: false }));
      }

      // Upload favicon if present
      if (hasFaviconUpload && branding.faviconFile) {
        const faviconFormData = new FormData();
        faviconFormData.append("file", branding.faviconFile);
        faviconFormData.append("type", "admin");
        faviconFormData.append("pageTitle", branding.pageTitle);
        faviconFormData.append("description", "Track and analyze your Adobe Stock performance");

        const faviconRes = await fetch("/api/admin/favicon", {
          method: "POST",
          body: faviconFormData,
        });

        if (!faviconRes.ok) throw new Error("Failed to upload favicon");

        const { data: faviconData } = await faviconRes.json();

        setBranding((prev) => ({
          ...prev,
          favicon: faviconData.fileUrl,
          faviconFile: undefined,
        }));

        setOriginalPageTitle(branding.pageTitle);
      } else if (hasPageTitleChange) {
        // Only metadata change, no file upload
        const metadataRes = await fetch("/api/admin/favicon/metadata", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "admin",
            pageTitle: branding.pageTitle,
            description: "Track and analyze your Adobe Stock performance",
          }),
        });

        if (!metadataRes.ok) throw new Error("Failed to update page title");

        setOriginalPageTitle(branding.pageTitle);
      }

      setSaved(true);
      // Wait 2.5s to ensure API is saved and cached cleared
      setTimeout(() => {
        window.location.href = `${window.location.href}?v=${Date.now()}`;
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-5 text-[11.5px] text-slate-400">
        <span>Configuration</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-orange-500 font-semibold">Settings</span>
      </div>

      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">General Settings</h1>
        <p className="text-slate-400 text-[13px] mt-1">
          Manage logos displayed in each section of the platform
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-6 text-[12px] text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-center gap-2.5 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 mb-6 text-[12px] text-sky-700">
        <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
        Upload logo in <strong>PNG</strong> or <strong>SVG</strong> format. Minimum recommended <strong>200×60px</strong>, transparent background.
      </div>

      {/* Top Section / Favicon & Title */}
      <div className="mb-8">
        {/* Section Label */}
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-4">
          Browser Tab
        </p>

        {/* Branding Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-900">Page Title & Favicon</h3>
          </div>

          <div className="space-y-5">
            {/* Favicon Upload */}
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-3">
                Favicon
              </label>
              <div className="flex items-center gap-4">
                {/* Favicon Preview */}
                <div className="w-14 h-14 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 flex-shrink-0">
                  {branding.favicon ? (
                    <img 
                      src={branding.favicon} 
                      alt="Favicon preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-[24px]">🔗</span>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors text-[12px] font-semibold w-fit">
                    <UploadCloud className="w-4 h-4" />
                    Upload Favicon
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setBranding({
                              ...branding,
                              favicon: event.target?.result as string,
                              faviconFile: file,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="text-[10.5px] text-slate-400">Recommended: 32×32px, PNG or ICO format</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100" />

            {/* Page Title */}
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-700 mb-2">
                Browser Tab Title
              </label>
              <input
                type="text"
                value={branding.pageTitle}
                onChange={(e) => setBranding({ ...branding, pageTitle: e.target.value })}
                placeholder="e.g., TrackStock | Adobe Analytics"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
              <p className="text-[10.5px] text-slate-400 mt-1.5">Text shown in browser tab title</p>
            </div>

            {/* Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200 mt-4">
              <p className="text-[10.5px] font-semibold text-blue-600 mb-3 uppercase tracking-wide">Preview</p>
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-blue-200">
                <div className="w-5 h-5 flex items-center justify-center text-[14px] flex-shrink-0">
                  {branding.favicon ? (
                    <img 
                      src={branding.favicon} 
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    "🔗"
                  )}
                </div>
                <span className="text-[12px] text-slate-700 font-medium">{branding.pageTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Label */}
      <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mb-3">
        Logo Configuration
      </p>

      {/* 3 Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {SECTIONS.map((section) => (
          <LogoCard
            key={section.key}
            section={section}
            data={logos[section.key]}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {/* Save Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            saved
              ? "bg-emerald-500 text-white scale-95"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" strokeWidth={2.5} />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
        <button className="px-5 py-2.5 rounded-xl text-[13px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}