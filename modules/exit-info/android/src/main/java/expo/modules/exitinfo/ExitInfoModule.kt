package expo.modules.exitinfo

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

/**
 * Why this app's process last died, as Android recorded it, and how much
 * memory the process holds now.
 *
 * An app killed for memory gets no exception and no callback: the process is
 * gone. But since Android 11 the system keeps a record of each death
 * (`ApplicationExitInfo`), and the next launch can read it. That is the only
 * way to tell "the phone ran out of memory" from "the app crashed".
 */
class ExitInfoModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExitInfo")

    Function("lastExits") { max: Int -> lastExits(max) }

    Function("heldBytes") { heldBytes() }
  }

  /** The main process's most recent deaths, newest first. Empty before Android 11. */
  private fun lastExits(max: Int): List<Map<String, Any?>> {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return emptyList()

    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val own = context.packageName
    // Asked for in full: the list also holds the WebView's helper processes,
    // which die all the time and would crowd the app's own deaths out.
    return manager.getHistoricalProcessExitReasons(own, 0, 0)
      .filter { it.processName == own }
      .take(max)
      .map {
        mapOf(
          "timestamp" to it.timestamp.toDouble(),
          "reason" to it.reason,
          "status" to it.status,
          "rssBytes" to it.rss * 1024.0,
          "pssBytes" to it.pss * 1024.0,
          "description" to it.description
        )
      }
  }

  /**
   * The process's own memory, in RAM and swapped out together. Swap is
   * counted because on a phone under pressure nearly all of a loaded model
   * sits there, and it is this total that the system's limits are set
   * against.
   */
  private fun heldBytes(): Double {
    var kilobytes = 0L
    try {
      File("/proc/self/status").forEachLine { line ->
        if (line.startsWith("RssAnon:") || line.startsWith("VmSwap:")) {
          kilobytes += line.filter { it.isDigit() }.toLongOrNull() ?: 0L
        }
      }
    } catch (e: Exception) {
      return 0.0
    }
    return kilobytes * 1024.0
  }
}
