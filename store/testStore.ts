import { create } from 'zustand';

interface Applications{
    appId: string;
    jobId: string;
    userId: string;
    userProfile:{
        name: string | null;
        email: string | null;
    }
}

interface TestStore{
    applications: Applications[];
    loading: boolean;
    error: string | null;
    fetchApplications: () => Promise<void>;
    fetchUserProfile: (userId: string) => Promise<{ id: string; name: string; email: string; }>
}

export const testStore = create<TestStore>((set, get) =>({

    applications: [],
    loading: false,
    error: null,

    fetchApplications: async () => {
        try {
            set({loading:true})

            const response = await fetch('https://api.store.com/v1/customers')

            if(!response.ok){
                throw new Error('Error fetching customers from server.')
            }

            const applicationsListRaw = await response.json()

            const applicationListFull = await Promise.all(
                applicationsListRaw.map(async (application: Applications) => {
                    const profile = await get().fetchUserProfile(application.userId);
                    return { 
                        ...application,
                        userProfile: profile
                    };
                })
            )

            set({loading:false, applications: applicationListFull})
        } catch (error) {
            if(error instanceof Error){
                set({loading:false, error: error.message})
            }
        }
    },

    fetchUserProfile: async (userId: string) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ id: userId, name: `User ${userId}`, email: `${userId}@test.com` });
            }, 1000); 
        });
    }
}))