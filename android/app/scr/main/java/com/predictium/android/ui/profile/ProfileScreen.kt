package com.predictium.android.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.predictium.android.ui.components.LoadingIndicator
import com.predictium.android.ui.theme.Success
import com.predictium.android.ui.theme.Warning

@Composable
fun ProfileScreen(
    onBuyTokens: () -> Unit,
    onWithdraw: () -> Unit,
    onUserClick: (Int) -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val user by viewModel.user.collectAsState()
    val predictions by viewModel.predictions.collectAsState()
    val transactions by viewModel.transactions.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()

    if (user == null) {
        LoadingIndicator()
        return
    }

    val u = user!!

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(u.username, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)

                if (u.premiumStatus) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Star, contentDescription = null, tint = Warning, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Premium", fontSize = 13.sp, color = Warning, fontWeight = FontWeight.SemiBold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Stats cards
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatCard("Balance", "${u.walletBalance}")
                    StatCard("Win Rate", "${(u.successRate * 100).toInt()}%")
                    StatCard("Predictions", "${u.totalPredictions}")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Action buttons
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(onClick = onBuyTokens, modifier = Modifier.weight(1f)) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Buy Tokens")
                    }
                    OutlinedButton(onClick = onWithdraw, modifier = Modifier.weight(1f)) {
                        Text("Withdraw")
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = onLogout) {
                    Text("Logout", color = MaterialTheme.colorScheme.error)
                }
            }
        }

        // Tabs
        item {
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                Tab(selected = selectedTab == 0, onClick = { viewModel.selectTab(0) }) {
                    Text("Predictions", modifier = Modifier.padding(12.dp))
                }
                Tab(selected = selectedTab == 1, onClick = { viewModel.selectTab(1) }) {
                    Text("Transactions", modifier = Modifier.padding(12.dp))
                }
            }
        }

        if (selectedTab == 0) {
            items(predictions, key = { it.id }) { prediction ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(12.dp)
                ) {
                    Text(prediction.eventTitle, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text(prediction.outcomeLabel, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            prediction.predictionStatus,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = when (prediction.predictionStatus) {
                                "won" -> Success; "lost" -> MaterialTheme.colorScheme.error; else -> Warning
                            }
                        )
                    }
                    Text("${prediction.amountTokens} tokens x${String.format("%.2f", prediction.lockedCoefficient)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            items(transactions, key = { it.id }) { tx ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(12.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                        Text(tx.type.replaceFirstChar { it.uppercase() }, fontWeight = FontWeight.SemiBold, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface)
                        Text(
                            "${if (tx.type in listOf("winning", "purchase", "bonus")) "+" else "-"}${tx.amount.toInt()}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = if (tx.type in listOf("winning", "purchase", "bonus")) Success else MaterialTheme.colorScheme.error
                        )
                    }
                    tx.description?.let {
                        Text(it, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
