package com.predictium.android.ui.events

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.predictium.android.ui.components.LoadingIndicator
import com.predictium.android.ui.components.StarRating
import com.predictium.android.ui.theme.Success
import com.predictium.android.ui.theme.Warning

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventDetailScreen(
    onUserClick: (Int) -> Unit,
    onBack: () -> Unit,
    viewModel: EventDetailViewModel = hiltViewModel()
) {
    val event by viewModel.event.collectAsState()
    val reviews by viewModel.reviews.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val predictionError by viewModel.predictionError.collectAsState()
    val predictionResult by viewModel.predictionResult.collectAsState()
    val hintStatus by viewModel.hintStatus.collectAsState()
    val hintResponse by viewModel.hintResponse.collectAsState()
    val hintLoading by viewModel.hintLoading.collectAsState()

    var selectedOutcome by remember { mutableIntStateOf(-1) }
    var betAmount by remember { mutableStateOf("") }
    var reviewRating by remember { mutableIntStateOf(0) }
    var reviewText by remember { mutableStateOf("") }
    val context = LocalContext.current

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(predictionError) {
        predictionError?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearPredictionError()
        }
    }

    LaunchedEffect(predictionResult) {
        predictionResult?.let {
            snackbarHostState.showSnackbar("Prediction placed! Coefficient: ${it.lockedCoefficient}")
            viewModel.clearPredictionResult()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Event Details") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {
                        event?.let { shareEvent(context, it.title, viewModel.eventId) }
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Share")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        if (isLoading) {
            LoadingIndicator(modifier = Modifier.padding(padding))
            return@Scaffold
        }

        val ev = event ?: return@Scaffold

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Event info
            Text(ev.title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
            Text(ev.description, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(ev.category.uppercase(), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("Status: ${ev.status}", fontSize = 12.sp, color = when (ev.status) {
                    "open" -> Success; "closed" -> Warning; else -> MaterialTheme.colorScheme.onSurfaceVariant
                })
            }

            // Outcomes + prediction form
            if (ev.status == "open" && !ev.outcomes.isNullOrEmpty()) {
                Text("Place Prediction", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)

                ev.outcomes!!.forEach { outcome ->
                    val isSelected = selectedOutcome == outcome.id
                    OutlinedButton(
                        onClick = { selectedOutcome = outcome.id },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else Color.Transparent
                        ),
                        border = ButtonDefaults.outlinedButtonBorder(enabled = true).let {
                            if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else it
                        }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(outcome.label, color = MaterialTheme.colorScheme.onSurface)
                            Text(
                                "x${String.format("%.2f", outcome.currentCoefficient)}",
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = betAmount,
                    onValueChange = { betAmount = it.filter { c -> c.isDigit() } },
                    label = { Text("Tokens to wager") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Button(
                    onClick = {
                        val amount = betAmount.toIntOrNull() ?: 0
                        if (selectedOutcome > 0 && amount > 0) {
                            viewModel.placePrediction(selectedOutcome, amount)
                        }
                    },
                    enabled = selectedOutcome > 0 && (betAmount.toIntOrNull() ?: 0) > 0,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("Place Prediction", fontWeight = FontWeight.SemiBold)
                }
            }

            // AI Hint section
            HorizontalDivider(color = MaterialTheme.colorScheme.outline)
            Text("AI Analysis", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)

            hintStatus?.let { status ->
                Text(
                    "Hints remaining: ${status.hintsRemaining}/${status.dailyLimit}",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            hintResponse?.let { hint ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(12.dp)
                ) {
                    Text(hint.hintText, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                }
            }

            Button(
                onClick = { viewModel.requestHint() },
                enabled = !hintLoading && (hintStatus?.hintsRemaining ?: 0) > 0,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (hintLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                } else {
                    Text("Get AI Hint")
                }
            }

            // Reviews
            HorizontalDivider(color = MaterialTheme.colorScheme.outline)
            Text("Reviews (${reviews.size})", fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)

            reviews.forEach { review ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(review.username, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                        StarRating(rating = review.rating)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(review.commentText, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // Write review
            Text("Write a Review", fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)

            StarRating(rating = reviewRating, onRatingChange = { reviewRating = it })

            OutlinedTextField(
                value = reviewText,
                onValueChange = { reviewText = it },
                label = { Text("Your review") },
                minLines = 2,
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    if (reviewRating > 0 && reviewText.isNotBlank()) {
                        viewModel.createReview(reviewRating, reviewText)
                        reviewRating = 0
                        reviewText = ""
                    }
                },
                enabled = reviewRating > 0 && reviewText.isNotBlank(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Submit Review")
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

private fun shareEvent(context: Context, title: String, eventId: Int) {
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, title)
        putExtra(Intent.EXTRA_TEXT, "Check out this prediction on Predictium: $title")
    }
    context.startActivity(Intent.createChooser(intent, "Share via"))
}
