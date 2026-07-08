"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Edit3,
  FileText,
  Hash,
  Info,
  Loader2,
  Palette,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersona } from "@/lib/hooks/facebook/persona/usePersona";
import { useSelectedPage } from "@/lib/hooks/facebook/selectedPage/SelectedPageContext";
import type { PersonaData } from "@/lib/hooks/facebook/persona/types";
import { PersonaEmptyState } from "@/components/persona/PersonaEmptyState";
import { PersonaFormEditor } from "@/components/persona/PersonaFormEditor";
import { PersonaViewGrid } from "@/components/persona/PersonaViewGrid";
import { PersonaRegenerateModal } from "@/components/persona/PersonaRegenerateModal";
import { PersonaDeleteModal } from "@/components/persona/PersonaDeleteModal";
import {
  clonePersona,
  createEmptyPersona,
  finalizePersonaForSave,
} from "@/components/persona/personaDefaults";

export default function PersonaSettingsClient() {
  const { selectedPage } = useSelectedPage();
  const selectedPageId = selectedPage?.page_id || "";
  const [postsLimit, setPostsLimit] = useState(30);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [draft, setDraft] = useState<PersonaData>(createEmptyPersona());
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasLoadedRef = useRef(false);

  const { persona, loading, error, build, load, save, regenerate, remove, reset } = usePersona();

  useEffect(() => {
    if (!selectedPageId) {
      reset();
      setMode("view");
      return;
    }
    if (!hasLoadedRef.current) hasLoadedRef.current = true;
    void load(selectedPageId).catch(() => undefined);
    setMode("view");
  }, [selectedPageId, load, reset]);

  const handleBuildWithAi = async () => {
    if (!selectedPageId) return;
    try {
      await build(selectedPageId, postsLimit);
      setMode("view");
    } catch {
      /* hook sets error */
    }
  };

  const startManualCreate = () => {
    setDraft(createEmptyPersona());
    setMode("create");
  };

  const startEdit = () => {
    if (!persona) return;
    setDraft(clonePersona(persona));
    setMode("edit");
  };

  const handleSave = async () => {
    if (!selectedPageId) return;
    const payload = finalizePersonaForSave(draft);
    try {
      await save(selectedPageId, payload);
      setMode("view");
    } catch {
      /* hook sets error */
    }
  };

  const handleDelete = async () => {
    if (!selectedPageId) return;
    try {
      await remove(selectedPageId);
      setShowDeleteConfirm(false);
      setMode("view");
      reset();
    } catch {
      /* hook sets error */
    }
  };

  const agentOptions = [
    { id: "content_patterns", label: "Content Patterns", icon: FileText },
    { id: "writing_style", label: "Writing Style", icon: Palette },
    { id: "topics_and_keywords", label: "Topics & Keywords", icon: Hash },
    { id: "audience", label: "Audience", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-2xl font-black text-slate-900">Persona</h2>
        <p className="text-sm font-medium text-slate-500">
          Build and manage AI personas for your Facebook pages
        </p>
      </div>

      {selectedPage ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-white p-6 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                Active Facebook Page
              </p>
              <p className="mt-1 text-lg font-black text-slate-900">{selectedPage.page_name}</p>
            </div>
            <Info className="h-5 w-5 shrink-0 text-primary" />
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Select a Facebook page from the header to manage personas.
          </p>
        </div>
      )}

      {selectedPageId ? (
        <div className="space-y-6">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          ) : null}

          {mode === "edit" || mode === "create" ? (
            <PersonaFormEditor
              value={draft}
              onChange={setDraft}
              onSave={handleSave}
              onCancel={() => setMode("view")}
              saving={loading}
              title={mode === "create" ? "Create your persona" : "Edit persona"}
            />
          ) : !persona ? (
            <PersonaEmptyState
              postsLimit={postsLimit}
              onPostsLimitChange={setPostsLimit}
              onBuildWithAi={() => void handleBuildWithAi()}
              onWriteYourself={startManualCreate}
              loading={loading}
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={startEdit} disabled={loading} className="rounded-xl">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRegenerateModal(true)}
                  disabled={loading}
                  className="rounded-xl"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate with AI
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void load(selectedPageId, true)}
                  disabled={loading}
                  className="rounded-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="rounded-xl text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <PersonaViewGrid persona={persona} />
            </>
          )}
        </div>
      ) : null}

      <PersonaRegenerateModal
        open={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        loading={loading}
        persona={persona}
        agentOptions={agentOptions}
        postsLimit={postsLimit}
        onPostsLimitChange={setPostsLimit}
        onConfirm={async (agents, requirements) => {
          if (!selectedPageId) return;
          await regenerate(
            selectedPageId,
            { regenerate_agents: agents.length ? agents : null, user_requirements: requirements },
            postsLimit,
          );
          setShowRegenerateModal(false);
          setMode("view");
        }}
      />

      <PersonaDeleteModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => void handleDelete()}
        loading={loading}
      />
    </div>
  );
}
