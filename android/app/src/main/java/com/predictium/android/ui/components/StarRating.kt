package com.predictium.android.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.predictium.android.ui.theme.Warning

@Composable
fun StarRating(
    rating: Int,
    maxRating: Int = 5,
    onRatingChange: ((Int) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Row(modifier = modifier) {
        (1..maxRating).forEach { star ->
            Icon(
                imageVector = if (star <= rating) Icons.Filled.Star else Icons.Outlined.Star,
                contentDescription = "Star $star",
                tint = if (star <= rating) Warning else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = if (onRatingChange != null) {
                    Modifier.clickable { onRatingChange(star) }
                } else {
                    Modifier
                }
            )
        }
    }
}
