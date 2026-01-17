"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { usePlannerStore } from "@/lib/store/usePlannerStore";
import { LocalStorageRepository, IYearPlannerRepository } from "@/lib/repository/LocalStorageRepository";
import { FirestoreRepository } from "@/lib/repository/FirestoreRepository";

// Global repository instance
let currentRepository: IYearPlannerRepository = new LocalStorageRepository();

export function getRepository(): IYearPlannerRepository {
    return currentRepository;
}

function RepositorySync({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const loadData = usePlannerStore((state) => state.loadData);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initRepository = async () => {
            if (authLoading) return;

            if (user) {
                currentRepository = new FirestoreRepository(user.uid);
            } else {
                currentRepository = new LocalStorageRepository();
            }

            await loadData();
            setIsReady(true);
        };

        initRepository();
    }, [user, authLoading, loadData]);

    if (authLoading || !isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-slate-500">Loading...</div>
            </div>
        );
    }

    return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <RepositorySync>{children}</RepositorySync>
        </AuthProvider>
    );
}
