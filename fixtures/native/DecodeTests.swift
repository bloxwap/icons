import XCTest

@MainActor
final class DecodeTests: XCTestCase {
    func testAllIconsDecodeAndThemeChanges() throws {
        let app = XCUIApplication(bundleIdentifier: "host.exp.Exponent")
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        if springboard.buttons["Open"].waitForExistence(timeout: 3) {
            springboard.buttons["Open"].tap()
        }
        app.activate()
        if app.buttons["Continue"].waitForExistence(timeout: 3) {
            app.buttons["Continue"].tap()
        }
        let result = app.staticTexts["decode-result"]
        XCTAssertTrue(result.waitForExistence(timeout: 40), app.debugDescription)
        let complete = NSPredicate(format: "label == %@", "123/123 decoded · 0 errors")
        expectation(for: complete, evaluatedWith: result)
        waitForExpectations(timeout: 30)
        // Expo Go can leave its developer sheet over the running gallery.
        // The heading above that sheet is safe to tap to dismiss it.
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.12)).tap()
        let theme = app.staticTexts["theme-result"]
        XCTAssertEqual(theme.label, "Dark theme")
        let dark = XCTAttachment(screenshot: app.screenshot())
        dark.name = "icons-dark"
        dark.lifetime = .keepAlways
        add(dark)
        app.buttons["Switch theme"].tap()
        expectation(for: NSPredicate(format: "label == %@", "Light theme"), evaluatedWith: theme)
        waitForExpectations(timeout: 5)
        XCTAssertEqual(result.label, "123/123 decoded · 0 errors")
        let light = XCTAttachment(screenshot: app.screenshot())
        light.name = "icons-light"
        light.lifetime = .keepAlways
        add(light)
    }
}
