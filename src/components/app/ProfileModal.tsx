"use client";

import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, AtSign, FileText, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  name: string;
  avatar: string | null;
  bio: string | null;
  xHandle: string | null;
  showOnLeaderboard: boolean;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: ProfileData;
  onUpdate?: (data: ProfileData) => void;
}

export const ProfileModal: FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    avatar: null,
    bio: null,
    xHandle: null,
    showOnLeaderboard: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      toast.success("profile updated successfully");
      onUpdate?.(updatedProfile);
      onClose();
    } catch (error) {
      toast.error("failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white border-2 border-ink rounded-[2rem] shadow-[8px_8px_0px_0px_#1A1A1A] w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-ink/10">
              <h2 className="font-display text-2xl lowercase text-ink">
                edit profile
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-ink/5 transition-colors"
              >
                <X size={20} className="text-ink" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink lowercase">
                  <User size={16} />
                  name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="chef_anon"
                  className="w-full p-3 rounded-xl border-2 border-ink/20 focus:border-accent-pink focus:outline-none transition-colors"
                  maxLength={50}
                />
              </div>

              {/* Avatar URL */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink lowercase">
                  <User size={16} />
                  avatar url
                </label>
                <input
                  type="url"
                  value={formData.avatar || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      avatar: e.target.value || null,
                    })
                  }
                  placeholder="https://example.com/avatar.png"
                  className="w-full p-3 rounded-xl border-2 border-ink/20 focus:border-accent-pink focus:outline-none transition-colors"
                />
              </div>

              {/* X Handle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink lowercase">
                  <AtSign size={16} />x handle
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.xHandle || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        xHandle: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") || null,
                      })
                    }
                    placeholder="username"
                    className="w-full p-3 pl-8 rounded-xl border-2 border-ink/20 focus:border-accent-pink focus:outline-none transition-colors"
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink lowercase">
                  <FileText size={16} />
                  bio
                </label>
                <textarea
                  value={formData.bio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value || null })
                  }
                  placeholder="tell us about your trading style..."
                  className="w-full p-3 rounded-xl border-2 border-ink/20 focus:border-accent-pink focus:outline-none transition-colors resize-none h-24"
                  maxLength={500}
                />
              </div>

              {/* Show on Leaderboard */}
              <div className="flex items-center justify-between p-3 rounded-xl border-2 border-ink/20">
                <div className="flex items-center gap-2">
                  {formData.showOnLeaderboard ? (
                    <Eye size={16} className="text-ink" />
                  ) : (
                    <EyeOff size={16} className="text-ink/40" />
                  )}
                  <span className="text-sm font-semibold text-ink lowercase">
                    show on leaderboard
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      showOnLeaderboard: !formData.showOnLeaderboard,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.showOnLeaderboard
                      ? "bg-accent-pink"
                      : "bg-ink/20"
                  }`}
                >
                  <motion.div
                    animate={{
                      x: formData.showOnLeaderboard ? 24 : 2,
                    }}
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                  />
                </button>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full p-4 rounded-full bg-ink text-white font-semibold lowercase flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                <Save size={18} />
                {isLoading ? "saving..." : "save changes"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
