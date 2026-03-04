"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Workspace } from "./types";
import {
  listWorkspaces,
  getCurrentWorkspaceId,
  setCurrentWorkspaceId,
} from "./api";
import { clearWorkspaceScopedCaches } from "@/lib/clearWorkspaceCaches";
import { useAuthContext } from "../auth/AuthContext";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: (forceRefresh?: boolean) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, setFacebookTokenFromWorkspace, checkFacebookToken } = useAuthContext();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyTokenStatusForWorkspace = useCallback(
    (workspace: Workspace) => {
      if (workspace.facebook_connected !== undefined) {
        setFacebookTokenFromWorkspace(workspace.facebook_connected);
      } else {
        void checkFacebookToken(true);
      }
    },
    [setFacebookTokenFromWorkspace, checkFacebookToken]
  );

  const loadWorkspaces = useCallback(async (forceRefresh?: boolean) => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await listWorkspaces({ forceRefresh });
      setWorkspaces(data);
      const storedWorkspaceId = getCurrentWorkspaceId();
      if (storedWorkspaceId) {
        const workspace = data.find((w) => w.id === storedWorkspaceId);
        if (workspace) {
          setCurrentWorkspaceState(workspace);
          setCurrentWorkspaceId(workspace.id);
          applyTokenStatusForWorkspace(workspace);
        } else {
          setCurrentWorkspaceId(null);
          if (data.length > 0) {
            setCurrentWorkspaceState(data[0]);
            setCurrentWorkspaceId(data[0].id);
            applyTokenStatusForWorkspace(data[0]);
          }
        }
      } else if (data.length > 0) {
        setCurrentWorkspaceState(data[0]);
        setCurrentWorkspaceId(data[0].id);
        applyTokenStatusForWorkspace(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setIsLoading(false);
    }
  }, [user, applyTokenStatusForWorkspace]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    if (workspace) {
      clearWorkspaceScopedCaches();
    }
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      setCurrentWorkspaceId(workspace.id);
    } else {
      setCurrentWorkspaceId(null);
    }
  }, []);

  const refreshWorkspaces = useCallback(async (forceRefresh?: boolean) => {
    await loadWorkspaces(forceRefresh);
  }, [loadWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoading,
        error,
        setCurrentWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceProvider");
  }
  return context;
}
