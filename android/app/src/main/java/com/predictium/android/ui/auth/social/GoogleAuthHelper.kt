package com.predictium.android.ui.auth.social

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/**
 * Launches the full "Sign in with Google" flow via Credential Manager and
 * returns the Google ID token (a JWT). Unlike GetGoogleIdOption (which only
 * offers already-authorized accounts and fails with "No credentials available"
 * when none exist), GetSignInWithGoogleOption shows the standard sign-in dialog
 * and lets the user pick or add a Google account. The backend verifies the
 * token, checking its audience equals our web client id (serverClientId).
 */
suspend fun getGoogleIdToken(context: Context, serverClientId: String): Result<String> = runCatching {
    val signInOption = GetSignInWithGoogleOption.Builder(serverClientId).build()

    val request = GetCredentialRequest.Builder()
        .addCredentialOption(signInOption)
        .build()

    val credentialManager = CredentialManager.create(context)
    val response = credentialManager.getCredential(context, request)
    val credential = GoogleIdTokenCredential.createFrom(response.credential.data)
    credential.idToken
}
