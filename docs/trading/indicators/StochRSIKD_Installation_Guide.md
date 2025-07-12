# StochRSIKD NinjaTrader Installation Guide

## Overview
This guide will help you install the custom StochRSIKD (Stochastic RSI with K and D lines) indicator into your NinjaTrader 8 platform running on Windows.

## Features
- **K Line**: Smoothed Stochastic RSI line (Blue/CornflowerBlue)
- **D Line**: Smoothed K line (Red/Orange)
- **Chart Alerts**: Visual arrows and text alerts when both K and D reach extreme levels
- **Audio Alerts**: Sound notifications for 100/100 and 0/0 conditions
- **Reference Lines**: Horizontal lines at 0, 10, 50, 90, and 100 levels
- **Dark/Light Theme Support**: Automatically adapts colors based on chart background
- **Enhanced Visibility**: Different line styles (solid, dashed, dotted) for better readability

## Installation Steps

### Step 1: Copy the File from WSL to Windows

Since you're running the code in WSL but need to install it in Windows NinjaTrader, you'll need to copy the file:

1. **Open File Explorer** in Windows
2. **Navigate to your WSL folder**:
   - Type in address bar: `\\wsl$\Ubuntu\home\nsm\code\deepbrain\goodiebag\docs\trading\indicators`
   - Or navigate via: `\\wsl$\[your-distro-name]\home\nsm\code\deepbrain\goodiebag\docs\trading\indicators`
3. **Copy the file** `StochRSIKD.cs` to your Windows desktop or Downloads folder

### Step 2: Install in NinjaTrader

1. **Open NinjaTrader 8**
2. **Open NinjaScript Editor**:
   - Go to `Tools` → `NinjaScript Editor`
   - Or press `F11`
3. **Import the Indicator**:
   - In NinjaScript Editor, go to `File` → `Import`
   - Browse to where you copied `StochRSIKD.cs`
   - Select the file and click `Open`
4. **Compile the Indicator**:
   - In NinjaScript Editor, go to `Tools` → `Compile`
   - Or press `F5`
   - Check for any compilation errors in the output window

### Step 3: Alternative Installation Method

If the import doesn't work, you can manually add the indicator:

1. **Open NinjaScript Editor**
2. **Create New Indicator**:
   - Go to `File` → `New` → `Indicator`
   - Name it `StochRSIKD`
3. **Replace the Generated Code**:
   - Delete all the auto-generated code
   - Copy and paste the entire contents from `StochRSIKD.cs`
4. **Compile**:
   - Press `F5` or go to `Tools` → `Compile`

### Step 4: Apply the Indicator to Chart

1. **Open a Chart** in NinjaTrader
2. **Add the Indicator**:
   - Right-click on the chart
   - Select `Indicators...`
   - Find `StochRSIKD` in the list
   - Double-click to add it
3. **Configure Parameters**:
   - **RSI Period**: 14 (default)
   - **Stoch Period**: 14 (default)
   - **K Period**: 3 (default)
   - **D Period**: 3 (default)
4. **Click OK** to apply

## Parameter Settings

### Default Parameters
- **RSI Period**: 14 - Period for RSI calculation
- **Stoch Period**: 14 - Period for Stochastic calculation on RSI
- **K Period**: 3 - Smoothing period for K line
- **D Period**: 3 - Smoothing period for D line

### Common Alternative Settings
- **Fast StochRSI**: RSI=14, Stoch=14, K=1, D=1
- **Slow StochRSI**: RSI=21, Stoch=21, K=5, D=5
- **TradingView Style**: RSI=14, Stoch=14, K=3, D=3 (default)

## Understanding the Alerts

### Visual Alerts
- **Red Arrow Down**: Appears when both K and D lines reach 100 (extreme overbought)
- **Green Arrow Up**: Appears when both K and D lines reach 0 (extreme oversold)
- **Text Alerts**: "OVERBOUGHT 100/100" or "OVERSOLD 0/0" messages

### Audio Alerts
- **Overbought**: Plays Alert1.wav when both lines hit 100
- **Oversold**: Plays Alert2.wav when both lines hit 0

## Troubleshooting

### Compilation Errors
If you get compilation errors:
1. Check that you copied the entire file content
2. Ensure no characters were corrupted during copy/paste
3. Verify NinjaTrader 8 is up to date

### Indicator Not Appearing
1. Make sure compilation was successful (no red errors)
2. Restart NinjaTrader if needed
3. Check that the indicator is in the correct namespace

### Alert Sounds Not Playing
1. Ensure sound files exist in: `C:\Program Files\NinjaTrader 8\sounds\`
2. Check Windows sound settings
3. Verify alert volume settings in NinjaTrader

## File Locations

### NinjaTrader Installation Directory
- Default: `C:\Program Files\NinjaTrader 8\`
- Custom indicators: `C:\Users\[Username]\Documents\NinjaTrader 8\bin\Custom\Indicators\`

### Sound Files
- Location: `C:\Program Files\NinjaTrader 8\sounds\`
- You can replace Alert1.wav and Alert2.wav with custom sounds

## Theme Support

The indicator automatically detects your chart theme and adjusts colors accordingly:

### Dark Theme Colors:
- **K Line**: Cornflower Blue (brighter for dark backgrounds)
- **D Line**: Orange (high contrast)
- **Reference Lines**: Light Gray (10/90), Gray (50), Red (100), Lime Green (0)

### Light Theme Colors:
- **K Line**: Blue (classic)
- **D Line**: Red (classic)
- **Reference Lines**: Dark Gray (10/90), Gray (50), Dark Red (100), Dark Green (0)

## Usage Tips

1. **Best Timeframes**: Works well on 1-hour, 4-hour, and daily charts
2. **Extreme Levels**: The 100/100 and 0/0 conditions are rare but significant
3. **Updated Signal Levels**: Now uses 10/90 levels instead of 20/80 for more precise signals
4. **Confirmation**: Use with other indicators for trade confirmation
5. **Backtesting**: Test the indicator on historical data before live trading
6. **Theme Switching**: Colors automatically adjust when you switch between light and dark themes

## Support

If you encounter issues:
1. Check the NinjaTrader log for error messages
2. Verify the indicator parameters match your trading style
3. Ensure your NinjaTrader version is compatible (NT8 required)

## Customization

You can modify the indicator by:
- Changing alert threshold levels (currently 100/0)
- Adjusting arrow colors and positions
- Modifying sound file references
- Adding additional alert conditions

Remember to recompile after any changes to the code.