"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function UserMenu() {
    const { user, loading, signInWithGoogle, signOut } = useAuth();

    if (loading) {
        return (
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        );
    }

    if (!user) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={signInWithGoogle}
                className="gap-2 text-sm"
            >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
            </Button>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-violet-400 transition-all">
                    {user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            className="h-8 w-8 rounded-full"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-medium">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        {user.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                className="h-10 w-10 rounded-full"
                            />
                        ) : (
                            <User className="h-10 w-10 text-slate-400" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user.displayName || "User"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="border-t pt-2">
                        <p className="text-xs text-slate-500 mb-2">
                            ✓ Data syncing to cloud
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={signOut}
                        className="w-full gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
