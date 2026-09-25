package com.predictium.android.ui.auth.social

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import com.facebook.CallbackManager
import com.facebook.FacebookCallback
import com.facebook.FacebookException
import com.facebook.login.LoginManager
import com.facebook.login.LoginResult

/**
 * Wires the Facebook LoginManager to an ActivityResultContract and returns a
 * lambda that launches the Facebook login dialog. On success the Facebook
 * access token is passed to [onSuccess]; the backend exchanges it for JWTs.
 */
@Composable
fun rememberFacebookLogin(
    onSuccess: (String) -> Unit,
    onError: (String) -> Unit,
): () -> Unit {
    val currentOnSuccess by rememberUpdatedState(onSuccess)
    val currentOnError by rememberUpdatedState(onError)

    val callbackManager = remember { CallbackManager.Factory.create() }
    val loginManager = remember { LoginManager.getInstance() }

    val launcher = rememberLauncherForActivityResult(
        contract = loginManager.createLogInActivityResultContract(callbackManager)
    ) { /* result delivered through the registered callback below */ }

    remember {
        loginManager.registerCallback(callbackManager, object : FacebookCallback<LoginResult> {
            override fun onSuccess(result: LoginResult) {
                currentOnSuccess(result.accessToken.token)
            }

            override fun onCancel() {
                currentOnError("Вхід через Facebook скасовано")
            }

            override fun onError(error: FacebookException) {
                currentOnError(error.message ?: "Не вдалось увійти через Facebook")
            }
        })
        true
    }

    return { launcher.launch(listOf("public_profile", "email")) }
}
