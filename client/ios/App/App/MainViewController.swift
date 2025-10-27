import UIKit
import Capacitor
import WebKit

class MainViewController: CAPBridgeViewController, WKNavigationDelegate {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        print("✅ MainViewController loaded with WebRTC support")
        
        // CRITICAL FIX: Ensure proper initialization sequence
        DispatchQueue.main.async {
            self.setupWebView()
        }
    }
    
    private func setupWebView() {
        // Ensure WebView loads properly
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            if let webView = self.webView {
                print("✅ WebView loaded successfully")
                
                // Add error handling for WebView
                webView.navigationDelegate = self
                
                // Force a small delay to ensure proper initialization
                webView.evaluateJavaScript("console.log('WebView ready')") { result, error in
                    if let error = error {
                        print("❌ WebView JS error: \(error)")
                    } else {
                        print("✅ WebView JS ready")
                    }
                }
            } else {
                print("❌ WebView not found - attempting to reload")
                // Try to reload the view
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    self.load()
                }
            }
        }
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
    
    // MARK: - WKNavigationDelegate
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("🌐 WebView started loading")
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("✅ WebView finished loading")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView failed to load: \(error.localizedDescription)")
        
        // Try to reload after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            print("🔄 Attempting to reload WebView...")
            webView.reload()
        }
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("❌ WebView failed provisional navigation: \(error.localizedDescription)")
        
        // Try to reload after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            print("🔄 Attempting to reload WebView...")
            webView.reload()
        }
    }
    
}

