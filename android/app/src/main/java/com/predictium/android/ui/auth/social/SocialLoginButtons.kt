package com.predictium.android.ui.auth.social

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.predictium.android.R
import kotlinx.coroutines.launch

private val FacebookBlue = Color(0xFF1877F2)

/**
 * "or" divider + Google and Facebook buttons. Shared by Login and Register
 * screens. Tokens are handed back to the caller (the ViewModel calls the
 * matching repository method).
 */
@Composable
fun SocialLoginButtons(
    enabled: Boolean,
    onGoogleToken: (String) -> Unit,
    onFacebookToken: (String) -> Unit,
    onError: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val serverClientId = stringResource(R.string.default_web_client_id)

    val launchFacebook = rememberFacebookLogin(
        onSuccess = onFacebookToken,
        onError = onError,
    )

    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        HorizontalDivider(modifier = Modifier.weight(1f))
        Text(
            text = "  або  ",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            fontSize = 13.sp,
        )
        HorizontalDivider(modifier = Modifier.weight(1f))
    }

    OutlinedButton(
        onClick = {
            scope.launch {
                getGoogleIdToken(context, serverClientId)
                    .onSuccess { onGoogleToken(it) }
                    .onFailure { onError(it.message ?: "Не вдалось увійти через Google") }
            }
        },
        enabled = enabled,
        modifier = modifier.fillMaxWidth().height(50.dp),
        shape = MaterialTheme.shapes.medium,
    ) {
        Text("Продовжити з Google", fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }

    Button(
        onClick = { launchFacebook() },
        enabled = enabled,
        modifier = modifier.fillMaxWidth().height(50.dp).padding(top = 12.dp),
        shape = MaterialTheme.shapes.medium,
        colors = ButtonDefaults.buttonColors(containerColor = FacebookBlue, contentColor = Color.White),
    ) {
        Text("Продовжити з Facebook", fontSize = 15.sp, fontWeight = FontWeight.Medium)
    }
}
