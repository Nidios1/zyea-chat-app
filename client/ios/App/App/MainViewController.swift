import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("✅ MainViewController loaded")
        
        // Add a small delay to ensure WebView is ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            if let webView = self.webView {
                print("✅ WebView is ready")
                webView.load(URLRequest(url: webView.url ?? URL(string: "about:blank")!))
            } else {
                print("⚠️ WebView not found, will load by Capacitor")
            }
        }
    }
    
    // Override webView configuration to enable WebRTC
    override func webViewConfiguration() -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration()
        
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
        
        print("✅ WebRTC configuration applied")
        
        return configuration
    }
    
    // Handle permission requests for media capture
    override func webView(_ webView: WKWebView, 
                         requestMediaCapturePermissionFor origin: WKSecurityOrigin, 
                         initiatedByFrame frame: WKFrameInfo, 
                         type: WKMediaCaptureType, 
                         decisionHandler: @escaping (WKPermissionDecision) -> Void) {
        
        print("🎥 Media capture permission requested")
        
        // Always grant permission (iOS system prompt will still show)
        decisionHandler(.grant)
    }
    
}

