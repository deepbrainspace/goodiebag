//
// Copyright (C) 2025, NinjaTrader LLC <www.ninjatrader.com>.
// NinjaTrader reserves the right to modify or overwrite this NinjaScript component with each release.
//
#region Using declarations

using System;
using System.ComponentModel.DataAnnotations;
using System.Windows.Media;
using NinjaTrader.NinjaScript.DrawingTools;
#endregion

//This namespace holds indicators in this folder and is required. Do not change it.
namespace NinjaTrader.NinjaScript.Indicators
{
    /// <summary>
    /// The StochRSI with K and D lines. Based on the original NinjaTrader StochRSI
    /// but adds a D line (smoothed K) and alert functionality for extreme conditions.
    /// </summary>
    public class StochRSIKD : Indicator
    {
        private MAX max;
        private MIN min;
        private RSI rsi;
        private SMA smaD;
        private Series<double> kValues;

        protected override void OnStateChange()
        {
            if (State == State.SetDefaults)
            {
                Description = "StochRSI with K and D lines, including overbought/oversold alerts";
                Name = "StochRSIKD";
                IsSuspendedWhileInactive = true;
                IsOverlay = false;
                Period = 14;
                DPeriod = 3;
                IsDarkTheme = true; // Default to dark theme

                // Add plots - K line (original StochRSI) and D line (smoothed K)
                AddPlot(Brushes.Blue, "K");
                AddPlot(Brushes.Red, "D");

                // Set initial theme colors
                SetThemeColors();
            }
            else if (State == State.Configure)
            {
                kValues = new Series<double>(this);
            }
            else if (State == State.DataLoaded)
            {
                rsi = RSI(Inputs[0], Period, 1);
                min = MIN(rsi, Period);
                max = MAX(rsi, Period);
                smaD = SMA(kValues, DPeriod);
            }
        }

        protected override void OnBarUpdate()
        {
            if (CurrentBar < Period)
                return;

            // Calculate K line (original StochRSI calculation)
            double rsi0 = rsi[0];
            double rsiL = min[0];
            double rsiH = max[0];

            double kValue = Math.Abs(rsi0 - rsiL) > double.Epsilon && Math.Abs(rsiH - rsiL) > double.Epsilon ? (rsi0 - rsiL) / (rsiH - rsiL) : 0;
            
            // Store K value
            kValues[0] = kValue;
            Values[0][0] = kValue; // K line plot

            // Calculate D line (smoothed K) after we have enough data
            if (CurrentBar >= Period + DPeriod - 1)
            {
                double dValue = smaD[0];
                Values[1][0] = dValue; // D line plot
                
                // Check for alert conditions
                CheckAlertConditions(kValue, dValue);
            }
        }

        private void SetThemeColors()
        {
            if (IsDarkTheme)
            {
                // Dark theme - brighter colors for better visibility
                Plots[0].Brush = Brushes.CornflowerBlue; // K line
                Plots[1].Brush = Brushes.Orange;         // D line
                
                // Add reference lines with high contrast colors for dark backgrounds
                AddLine(Brushes.Yellow, 0.9, "Upper");      // Bright yellow for 90% line
                AddLine(Brushes.Yellow, 0.1, "Lower");      // Bright yellow for 10% line
                AddLine(Brushes.White, 0.5, "Middle");      // White for 50% line
                AddLine(Brushes.Red, 1.0, "Top");           // Red for 100% line
                AddLine(Brushes.LimeGreen, 0.0, "Bottom");  // Lime green for 0% line
            }
            else
            {
                // Light theme - darker colors for better visibility
                Plots[0].Brush = Brushes.Blue;     // K line
                Plots[1].Brush = Brushes.Red;      // D line
                
                // Add reference lines with high contrast colors for light backgrounds
                AddLine(Brushes.DarkBlue, 0.9, "Upper");    // Dark blue for 90% line
                AddLine(Brushes.DarkBlue, 0.1, "Lower");    // Dark blue for 10% line
                AddLine(Brushes.Black, 0.5, "Middle");      // Black for 50% line
                AddLine(Brushes.DarkRed, 1.0, "Top");       // Dark red for 100% line
                AddLine(Brushes.DarkGreen, 0.0, "Bottom");  // Dark green for 0% line
            }
        }

        private void CheckAlertConditions(double kValue, double dValue)
        {
            // Check for extreme overbought condition (both K and D exactly at 1.0)
            if (kValue >= 0.999 && dValue >= 0.999)
            {
                // Change background to red for overbought condition
                BackBrush = Brushes.Red;
                BackBrushes[0] = Brushes.Red;
                
                // Optional: Play alert sound
                if (IsFirstTickOfBar)
                {
                    Alert("StochRSI_Overbought", Priority.High, "StochRSI K&D both at 100%", 
                        NinjaTrader.Core.Globals.InstallDir + @"\sounds\Alert1.wav", 10, 
                        Brushes.Red, Brushes.Black);
                }
            }
            // Check for extreme oversold condition (both K and D exactly at 0.0)
            else if (kValue <= 0.001 && dValue <= 0.001)
            {
                // Change background to green for oversold condition
                BackBrush = Brushes.Green;
                BackBrushes[0] = Brushes.Green;
                
                // Optional: Play alert sound
                if (IsFirstTickOfBar)
                {
                    Alert("StochRSI_Oversold", Priority.High, "StochRSI K&D both at 0%", 
                        NinjaTrader.Core.Globals.InstallDir + @"\sounds\Alert2.wav", 10, 
                        Brushes.Green, Brushes.Black);
                }
            }
            else
            {
                // Reset background to transparent when not in extreme conditions
                BackBrush = Brushes.Transparent;
                BackBrushes[0] = Brushes.Transparent;
            }
        }

        #region Properties
        [Range(1, int.MaxValue), NinjaScriptProperty]
        [Display(Name = "Period", Description = "Period for StochRSI calculation", GroupName = "Parameters", Order = 0)]
        public int Period { get; set; }

        [Range(1, int.MaxValue), NinjaScriptProperty]
        [Display(Name = "D Period", Description = "Period for D line smoothing", GroupName = "Parameters", Order = 1)]
        public int DPeriod { get; set; }

        [NinjaScriptProperty]
        [Display(Name = "Dark Theme", Description = "Use dark theme colors for better visibility on dark backgrounds", GroupName = "Appearance", Order = 2)]
        public bool IsDarkTheme { get; set; }
        #endregion
    }
}

#region NinjaScript generated code. Neither change nor remove.

namespace NinjaTrader.NinjaScript.Indicators
{
    public partial class Indicator : NinjaTrader.Gui.NinjaScript.IndicatorRenderBase
    {
        private StochRSIKD[] cacheStochRSIKD;
        public StochRSIKD StochRSIKD(int period, int dPeriod, bool isDarkTheme)
        {
            return StochRSIKD(Input, period, dPeriod, isDarkTheme);
        }

        public StochRSIKD StochRSIKD(ISeries<double> input, int period, int dPeriod, bool isDarkTheme)
        {
            if (cacheStochRSIKD != null)
                for (int idx = 0; idx < cacheStochRSIKD.Length; idx++)
                    if (cacheStochRSIKD[idx] != null && cacheStochRSIKD[idx].Period == period && cacheStochRSIKD[idx].DPeriod == dPeriod && cacheStochRSIKD[idx].IsDarkTheme == isDarkTheme && cacheStochRSIKD[idx].EqualsInput(input))
                        return cacheStochRSIKD[idx];
            return CacheIndicator<StochRSIKD>(new StochRSIKD(){ Period = period, DPeriod = dPeriod, IsDarkTheme = isDarkTheme }, input, ref cacheStochRSIKD);
        }
    }
}

namespace NinjaTrader.NinjaScript.MarketAnalyzerColumns
{
    public partial class MarketAnalyzerColumn : MarketAnalyzerColumnBase
    {
        public Indicators.StochRSIKD StochRSIKD(int period, int dPeriod, bool isDarkTheme)
        {
            return indicator.StochRSIKD(Input, period, dPeriod, isDarkTheme);
        }

        public Indicators.StochRSIKD StochRSIKD(ISeries<double> input , int period, int dPeriod, bool isDarkTheme)
        {
            return indicator.StochRSIKD(input, period, dPeriod, isDarkTheme);
        }
    }
}

namespace NinjaTrader.NinjaScript.Strategies
{
    public partial class Strategy : NinjaTrader.Gui.NinjaScript.StrategyRenderBase
    {
        public Indicators.StochRSIKD StochRSIKD(int period, int dPeriod, bool isDarkTheme)
        {
            return indicator.StochRSIKD(Input, period, dPeriod, isDarkTheme);
        }

        public Indicators.StochRSIKD StochRSIKD(ISeries<double> input , int period, int dPeriod, bool isDarkTheme)
        {
            return indicator.StochRSIKD(input, period, dPeriod, isDarkTheme);
        }
    }
}

#endregion