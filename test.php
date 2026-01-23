<?php
// Simple PHP test file
echo "<h1>PHP is working!</h1>";
echo "<p>Server Info:</p>";
echo "<ul>";
echo "<li>PHP Version: " . phpversion() . "</li>";
echo "<li>Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "</li>";
echo "<li>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
echo "</ul>";

// Test if file includes work
echo "<hr>";
echo "<h2>Testing File Includes:</h2>";

// Try to include a test file
$test_include = "includes/test-include.html";
if (file_exists($test_include)) {
    echo "<p style='color: green;'>✓ Include file found and loaded:</p>";
    include $test_include;
} else {
    echo "<p style='color: orange;'>⚠ Test include file not found at: $test_include</p>";
    echo "<p>Create a file at 'includes/test-include.html' with some test content to verify includes work.</p>";
}
?>

<style>
    body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 50px auto;
        padding: 20px;
        background: #f5f5f5;
    }
    h1 { color: #2c5282; }
    ul { background: white; padding: 20px; border-radius: 5px; }
</style>