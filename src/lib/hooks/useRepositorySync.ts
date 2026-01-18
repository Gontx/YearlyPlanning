"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useDataStore } from "@/lib/store/useDataStore";
import {
    LocalStorageRepository,
    IYearPlannerRepository,
} from "@/lib/repository/LocalStorageRepository";
import { FirestoreRepository } from "@/lib/repository/FirestoreRepository";

// Global repository instance that can be swapped
let currentRepository: IYearPlannerRepository = new LocalStorageRepository();

export function getRepository(): IYearPlannerRepository {
    return currentRepository;
}

export function useRepositorySync() {
    const { user, loading } = useAuth();
    const hasLoadedRef = useRef(false);
    const previousUserIdRef = useRef<string | null>(null);
    const loadData = useDataStore((state) => state.loadData);

    const switchRepository = useCallback(
        async (userId: string | null) => {
            if (userId) {
                // User is signed in - use Firestore
                currentRepository = new FirestoreRepository(userId);
            } else {
                // User is signed out - use localStorage
                currentRepository = new LocalStorageRepository();
            }
            // Reload data with new repository
            await loadData();
        },
        [loadData]
    );

    useEffect(() => {
        if (loading) return;

        const userId = user?.uid || null;

        // Check if user changed
        if (previousUserIdRef.current !== userId || !hasLoadedRef.current) {
            previousUserIdRef.current = userId;
            hasLoadedRef.current = true;
            switchRepository(userId);
        }
    }, [user, loading, switchRepository]);

    return { loading };
}
