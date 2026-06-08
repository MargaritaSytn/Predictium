package com.predictium.android.ui.payments

import android.app.Activity
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner

private val TOKEN_PACKAGES = listOf(500, 1200, 3000, 7000)
private const val TOKEN_PRICE = 0.10

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BuyTokensScreen(
    onBack: () -> Unit,
    viewModel: BuyTokensViewModel = hiltViewModel()
) {
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val approvalUrl by viewModel.approvalUrl.collectAsState()
    val pendingOrderId by viewModel.pendingOrderId.collectAsState()
    val purchaseSuccess by viewModel.purchaseSuccess.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val snackbarHostState = remember { SnackbarHostState() }

    // Handle deep link return: predictium://payment/success?order_id=...
    LaunchedEffect(Unit) {
        val intent = (context as? Activity)?.intent
        val uri = intent?.data
        if (uri?.scheme == "predictium" && uri.host == "payment") {
            val orderId = uri.getQueryParameter("order_id")
            if (!orderId.isNullOrBlank()) {
                viewModel.capturePayment(orderId)
                intent.data = null  // consume the deep link so it's not re-processed
            }
        }
    }

    // Lifecycle observer — auto-capture when app returns to foreground from Custom Tab
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && pendingOrderId != null) {
                viewModel.capturePayment()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // Open PayPal in Chrome Custom Tab
    LaunchedEffect(approvalUrl) {
        approvalUrl?.let { url ->
            if (url.isNotBlank()) {
                val customTabsIntent = CustomTabsIntent.Builder().build()
                customTabsIntent.launchUrl(context, Uri.parse(url))
                viewModel.clearApprovalUrl()
            }
        }
    }

    // Show errors
    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    // Show success
    LaunchedEffect(purchaseSuccess) {
        if (purchaseSuccess) {
            snackbarHostState.showSnackbar("Токени успішно куплені!")
            viewModel.clearSuccess()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Купити токени") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Оберіть пакет токенів",
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )

            TOKEN_PACKAGES.forEach { amount ->
                val price = amount * TOKEN_PRICE
                OutlinedCard(
                    onClick = { if (!isLoading) viewModel.purchaseTokens(amount) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("$amount токенів", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.onSurface)
                            Text("$${"%.2f".format(price)} USD", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Button(
                            onClick = { viewModel.purchaseTokens(amount) },
                            enabled = !isLoading
                        ) {
                            Text("Купити")
                        }
                    }
                }
            }

            if (isLoading) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
        }
    }
}
