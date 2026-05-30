package com.predictium.android.ui.share

import android.content.Context
import android.content.Intent

object ShareUtils {

    fun shareEvent(context: Context, eventTitle: String, eventId: Int) {
        val text = "Check out this prediction on Predictium: $eventTitle"
        share(context, eventTitle, text)
    }

    fun sharePrediction(context: Context, eventTitle: String, outcome: String, result: String) {
        val text = "I predicted \"$outcome\" on \"$eventTitle\" — $result! Join me on Predictium."
        share(context, eventTitle, text)
    }

    private fun share(context: Context, subject: String, text: String) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, text)
        }
        context.startActivity(Intent.createChooser(intent, "Share via"))
    }
}
