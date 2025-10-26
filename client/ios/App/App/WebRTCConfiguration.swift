import Foundation
import Capacitor
import WebKit

// NOTE: This plugin is now DEPRECATED
// WebRTC configuration is now handled in MainViewController.swift
// which configures WKWebView BEFORE initialization (more reliable)
// 
// This plugin runs AFTER webView is created, which is too late for some settings
// Keep this file for backwards compatibility but it's no longer the primary solution

@objc(WebRTCConfigurationPlugin)
public class WebRTCConfigurationPlugin: CAPPlugin {
    
    @objc override public func load() {
        print("⚠️ WebRTCConfigurationPlugin loaded (DEPRECATED)")
        print("   → WebRTC config is now in MainViewController")
        
        // Still run as backup layer
        verifyWebRTCConfiguration()
    }
    
    private func verifyWebRTCConfiguration() {
        guard let webView = self.bridge?.webView else {
            print("❌ WebView not available in plugin")
            return
        }
        
        // Verify configuration (should already be set by MainViewController)
        let config = webView.configuration
        print("📋 WebRTC Configuration Verification:")
        print("   - allowsInlineMediaPlayback: \(config.allowsInlineMediaPlayback)")
        print("   - mediaTypesRequiringUserAction: \(config.mediaTypesRequiringUserActionForPlayback)")
        print("   - allowsPictureInPictureMediaPlayback: \(config.allowsPictureInPictureMediaPlayback)")
        
        // Double-check critical settings (backup layer)
        if !config.allowsInlineMediaPlayback {
            print("⚠️ Fixing: allowsInlineMediaPlayback was false!")
            config.allowsInlineMediaPlayback = true
        }
        
        if !config.mediaTypesRequiringUserActionForPlayback.isEmpty {
            print("⚠️ Fixing: mediaTypesRequiringUserActionForPlayback was not empty!")
            config.mediaTypesRequiringUserActionForPlayback = []
        }
        
        print("✅ WebRTC verification complete")
    }
}

