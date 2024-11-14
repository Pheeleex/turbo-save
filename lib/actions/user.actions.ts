'use server'

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { avatarPlaceholderUrl } from "@/constants";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { create } from "domain";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
    const { databases } = await createAdminClient();
  
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("email", [email])],
    );
    console.log(email)
  
    return result.total > 0 ? result.documents[0] : null;
  };
  
  const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
  };

  export const sendEmailOTP = async ({ email }: { email: string }) => {
    const { account } = await createAdminClient();
  
    try {
      const session = await account.createEmailToken(ID.unique(), email);
      console.log(session.userId)
      return session.userId;
    } catch (error) {
      handleError(error, "Failed to send email OTP");
    }
  };

export const createAccount = async({
    fullName,
    email,
}: {
    fullName: string;
    email: string;
}) => {
    const existingUser = await getUserByEmail(email)

    const accountId = await sendEmailOTP({email});
    if (!accountId) throw new Error("Failed to send OTP")

        if (!existingUser) {
            const { databases } = await createAdminClient();
        
            await databases.createDocument(
              appwriteConfig.databaseId,
              appwriteConfig.usersCollectionId,
              ID.unique(),
              {
                fullName,
                email,
                avatar: avatarPlaceholderUrl,
                accountId,
              },
            );
            console.log(fullName, email, accountId)
          }
          return parseStringify({ accountId }) 
}

export const verifySecret = async ({
    accountId,
    password,
  }: {
    accountId: string;
    password: string;
  }) => {
    try {
      const { account } = await createAdminClient();
  
      const session = await account.createSession(accountId, password);
  
      (await cookies()).set("appwrite-session", session.secret, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: true,
      });
      console.log('sessionid', session.$id)
      return parseStringify( {sessionId: session.$id});
    } catch (error) {
      handleError(error, "Failed to verify OTP");
    }
  };
  
  export const getCurrentUser = async () => {
    try {
      const { databases, account } = await createSessionClient();
  
      const result = await account.get();
  
      const user = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("accountId", result.$id)],
      );
  
      if (user.total <= 0) return null;
  console.log(user)
      return parseStringify(user.documents[0]);
    } catch (error) {
      console.log(error);
    }
  };

  export const signOutUser = async () => {
    const { account } = await createSessionClient();
  
    try {
      await account.deleteSession("current");
      (await cookies()).delete("appwrite-session");
    } catch (error) {
      handleError(error, "Failed to sign out user");
    } finally {
      redirect("/sign-in");
    }
  };

  export const signInUser = async ({ email }: { email: string }) => {
    try {
      const existingUser = await getUserByEmail(email);
  
      // User exists, send OTP
      if (existingUser) {
        await sendEmailOTP({ email });
        return parseStringify({ accountId: existingUser.accountId });
      }
     console.log(existingUser)
      return parseStringify({ accountId: null, error: "User not found" });
    } catch (error) {
      handleError(error, "Failed to sign in user");
    }
  };