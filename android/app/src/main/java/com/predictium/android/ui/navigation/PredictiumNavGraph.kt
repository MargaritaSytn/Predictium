package com.predictium.android.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.predictium.android.ui.auth.AuthViewModel
import com.predictium.android.ui.auth.LoginScreen
import com.predictium.android.ui.auth.RegisterScreen
import com.predictium.android.ui.events.EventDetailScreen
import com.predictium.android.ui.events.EventListScreen
import com.predictium.android.ui.home.HomeScreen
import com.predictium.android.ui.notifications.NotificationsScreen
import com.predictium.android.ui.payments.BuyTokensScreen
import com.predictium.android.ui.payments.WithdrawScreen
import com.predictium.android.ui.profile.ProfileScreen
import com.predictium.android.ui.profile.PublicProfileScreen

@Composable
fun PredictiumNavGraph() {
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    val isLoading by authViewModel.isLoading.collectAsState()

    if (isLoading) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            androidx.compose.material3.CircularProgressIndicator(
                color = MaterialTheme.colorScheme.primary
            )
        }
        return
    }

    if (isLoggedIn) {
        MainNavGraph(authViewModel = authViewModel)
    } else {
        AuthNavGraph(authViewModel = authViewModel)
    }
}

@Composable
private fun AuthNavGraph(authViewModel: AuthViewModel) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            LoginScreen(
                viewModel = authViewModel,
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }
        composable(Screen.Register.route) {
            RegisterScreen(
                viewModel = authViewModel,
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }
    }
}

@Composable
private fun MainNavGraph(authViewModel: AuthViewModel) {
    val navController = rememberNavController()
    val unreadCount by authViewModel.unreadNotificationCount.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val bottomTabs = BottomTab.entries
    val showBottomBar = bottomTabs.any { tab ->
        currentDestination?.hierarchy?.any { it.route == tab.screen.route } == true
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface
                ) {
                    bottomTabs.forEach { tab ->
                        val selected = currentDestination?.hierarchy?.any {
                            it.route == tab.screen.route
                        } == true

                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                if (tab == BottomTab.NOTIFICATIONS && unreadCount > 0) {
                                    BadgedBox(badge = {
                                        Badge { Text(unreadCount.toString()) }
                                    }) {
                                        Icon(tab.icon, contentDescription = tab.label)
                                    }
                                } else {
                                    Icon(tab.icon, contentDescription = tab.label)
                                }
                            },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                indicatorColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onEventClick = { eventId ->
                        navController.navigate(Screen.EventDetail.createRoute(eventId))
                    }
                )
            }

            composable(Screen.EventList.route) {
                EventListScreen(
                    onEventClick = { eventId ->
                        navController.navigate(Screen.EventDetail.createRoute(eventId))
                    }
                )
            }

            composable(
                route = Screen.EventDetail.route,
                arguments = listOf(navArgument("eventId") { type = NavType.IntType })
            ) {
                EventDetailScreen(
                    onUserClick = { userId ->
                        navController.navigate(Screen.PublicProfile.createRoute(userId))
                    },
                    onBack = { navController.popBackStack() }
                )
            }

            composable(Screen.Profile.route) {
                ProfileScreen(
                    onBuyTokens = { navController.navigate(Screen.BuyTokens.route) },
                    onWithdraw = { navController.navigate(Screen.Withdraw.route) },
                    onUserClick = { userId ->
                        navController.navigate(Screen.PublicProfile.createRoute(userId))
                    },
                    onLogout = { authViewModel.logout() }
                )
            }

            composable(Screen.BuyTokens.route) {
                BuyTokensScreen(onBack = { navController.popBackStack() })
            }

            composable(Screen.Withdraw.route) {
                WithdrawScreen(onBack = { navController.popBackStack() })
            }

            composable(Screen.Notifications.route) {
                NotificationsScreen()
            }

            composable(
                route = Screen.PublicProfile.route,
                arguments = listOf(navArgument("userId") { type = NavType.IntType })
            ) {
                PublicProfileScreen(onBack = { navController.popBackStack() })
            }
        }
    }
}
