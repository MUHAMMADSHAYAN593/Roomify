interface Authstate {
    isSignedIn: boolean;
    userName: string | null;
    userID: string | null;
}


type AuthContext = {
    isSignedIn: boolean;
    userName: string | null;
    userID: string | null;
    refreshAuth: () => Promise<boolean>;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}
