package com.predictium.android.ui.auth.social

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential

/**
 * Launches the Google account picker via Credential Manager and returns the
 * Google ID token (a JWT). The backend verifies this token, checking that its
 * audience equals our web client id (serverClientId).
 */
suspend fun getGoogleIdToken(context: Context, serverClientId: String): Result<String> = runCatching {
    val googleIdOption = GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(false)
        .setServerClientId(serverClientId)
        .setAutoSelectEnabled(false)
        .build()

    val request = GetCredentialRequest.Builder()
        .addCredentialOption(googleIdOption)
        .build()

    val credentialManager = CredentialManager.create(context)
    val response = credentialManager.getCredential(context, request)
    val credential = GoogleIdTokenCredential.createFrom(response.credential.data)
    credential.idToken
}
