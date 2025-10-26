import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("✅ MainViewController loaded with WebRTC support")
    }
    
    // CRITICAL FIX: Override webView configuration to enable WebRTC
    // This ensures navigator.mediaDevices.getUserMedia is available in iOS native
    override func webViewConfiguration() -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration()
        
        // Configure preferences for JavaScript
        let preferences = WKPreferences()
        preferences.javaScriptCanOpenWindowsAutomatically = true
        
        // Apply preferences
        configuration.preferences = preferences
        
        // Enable inline media playback (for video calls)
        configuration.allowsInlineMediaPlayback = true
        
        // Allow media to play without user interaction
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Enable Picture-in-Picture
        configuration.allowsPictureInPictureMediaPlayback = true
        
        // Disable domain restrictions for WebRTC
        if #available(iOS 14.3, *) {
            configuration.limitsNavigationsToAppBoundDomains = false
        }
        
        // Enable file access (needed for some WebRTC scenarios)
        configuration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        print("✅ WebRTC WKWebView configuration applied:")
        print("   - allowsInlineMediaPlayback: true")
        print("   - mediaTypesRequiringUserActionForPlayback: []")
        print("   - allowsPictureInPictureMediaPlayback: true")
        print("   - limitsNavigationsToAppBoundDomains: false")
        
        return configuration
    }
    
    // Optional: Handle permission requests
    override func webView(_ webView: WKWebView, 
                         requestMediaCapturePermissionFor origin: WKSecurityOrigin, 
                         initiatedByFrame frame: WKFrameInfo, 
                         type: WKMediaCaptureType, 
                         decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        
        print("🎥 Media capture permission requested:")
        print("   Origin: \(origin)")
        print("   Type: \(type == .camera ? "Camera" : type == .microphone ? "Microphone" : "Camera & Microphone")")
        
        // Always grant permission (iOS system prompt will still show)
        decisionHandler(.grant)
    }
    
}

