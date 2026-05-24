package com.predictium.android.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String) {
    // Auth
    data object Login : Screen("auth/login")
    data object Register : Screen("auth/register")

    // Main tabs
    data object Home : Screen("home")
    data object EventList : Screen("events")
    data object Profile : Screen("profile")
    data object Notifications : Screen("notifications")

    // Detail screens
    data object EventDetail : Screen("events/{eventId}") {
        fun createRoute(eventId: Int) = "events/$eventId"
    }

    data object PublicProfile : Screen("users/{userId}") {
        fun createRoute(userId: Int) = "users/$userId"
    }

    // Payment screens
    data object BuyTokens : Screen("profile/buy")
    data object Withdraw : Screen("profile/withdraw")
}

enum class BottomTab(val screen: Screen, val label: String, val icon: ImageVector) {
    HOME(Screen.Home, "Home", Icons.Default.Home),
    EVENTS(Screen.EventList, "Events", Icons.Default.List),
    PROFILE(Screen.Profile, "Profile", Icons.Default.Person),
    NOTIFICATIONS(Screen.Notifications, "Notifications", Icons.Default.Notifications)
}
