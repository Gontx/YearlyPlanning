import { DayData, HolidaySettings } from "@/types";
import { IYearPlannerRepository } from "./LocalStorageRepository";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    query,
    Firestore,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export class FirestoreRepository implements IYearPlannerRepository {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    private get userDocRef() {
        if (!db) throw new Error("Firestore not initialized");
        return doc(db as Firestore, "users", this.userId);
    }

    private get dayDataCollection() {
        if (!db) throw new Error("Firestore not initialized");
        return collection(db as Firestore, "users", this.userId, "dayData");
    }

    async getDayData(date: string): Promise<DayData | null> {
        try {
            const docRef = doc(this.dayDataCollection, date);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as DayData;
            }
            return null;
        } catch (error) {
            console.error("Error getting day data:", error);
            return null;
        }
    }

    async saveDayData(dayData: DayData): Promise<void> {
        try {
            const docRef = doc(this.dayDataCollection, dayData.date);
            await setDoc(docRef, dayData);
        } catch (error) {
            console.error("Error saving day data:", error);
        }
    }

    async getAllDayData(): Promise<Record<string, DayData>> {
        try {
            const q = query(this.dayDataCollection);
            const querySnapshot = await getDocs(q);
            const result: Record<string, DayData> = {};
            querySnapshot.forEach((doc) => {
                result[doc.id] = doc.data() as DayData;
            });
            return result;
        } catch (error) {
            console.error("Error getting all day data:", error);
            return {};
        }
    }

    async getSettings(): Promise<HolidaySettings | null> {
        try {
            const docSnap = await getDoc(this.userDocRef);
            if (docSnap.exists() && docSnap.data().settings) {
                return docSnap.data().settings as HolidaySettings;
            }
            return null;
        } catch (error) {
            console.error("Error getting settings:", error);
            return null;
        }
    }

    async saveSettings(settings: HolidaySettings): Promise<void> {
        try {
            await setDoc(this.userDocRef, { settings }, { merge: true });
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }

    async searchPlans(query: string): Promise<import("@/types").Plan[]> {
        // For now, search locally from all day data
        const all = await this.getAllDayData();
        const queryLower = query.toLowerCase();
        const results: import("@/types").Plan[] = [];

        Object.values(all).forEach((day) => {
            day.plans.forEach((plan) => {
                if (
                    plan.title.toLowerCase().includes(queryLower) ||
                    plan.notes?.toLowerCase().includes(queryLower) ||
                    plan.tag.toLowerCase().includes(queryLower)
                ) {
                    results.push(plan);
                }
            });
        });

        return results;
    }
}
