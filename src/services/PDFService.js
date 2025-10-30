export class PDFService {
  constructor(dbService, calcService) {
    this.dbService = dbService;
    this.calcService = calcService;
  }

  async generateAdvancedPDF(registros, period = 'mensual', customRange = null) {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const conductor = await this.dbService.getConductor();
      const conductorName = conductor ? `${conductor.nombre} ${conductor.apellido}` : 'Conductor';
      
      // Calculate totals and statistics
      const totals = this.calcService.calculateMonthlyTotals(registros);
      const stats = this.calculateAdvancedStats(registros);
      
      // Generate PDF content
      this.addHeader(doc, conductorName, period, customRange);
      this.addExecutiveSummary(doc, totals, stats);
      this.addDetailedBreakdown(doc, totals);
      this.addDailyBreakdown(doc, registros);
      this.addPerformanceAnalysis(doc, stats);
      this.addFooter(doc);
      
      // Generate filename
      const filename = this.generateFilename(conductorName, period, customRange);
      
      // Download PDF
      doc.save(filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  addHeader(doc, conductorName, period, customRange) {
    // Logo/Title area with background
    doc.setFillColor(79, 209, 199); // Accent color
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title
    doc.setTextColor(26, 31, 46); // Dark color
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('INFORME DE ACTIVIDAD', 20, 25);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Conductor Tracker - Reporte Profesional', 20, 35);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
    
    // Conductor info
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL CONDUCTOR', 20, 55);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Conductor: ${conductorName}`, 25, 65);
    
    // Period info
    const periodInfo = this.getPeriodInfo(period, customRange);
    doc.text(`Período: ${periodInfo.text}`, 25, 75);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 25, 85);
    
    // Separator line
    doc.setDrawColor(79, 209, 199);
    doc.setLineWidth(1);
    doc.line(20, 95, 190, 95);
  }

  addExecutiveSummary(doc, totals, stats) {
    let yPos = 110;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('📊 RESUMEN EJECUTIVO', 20, yPos);
    yPos += 15;
    
    // Key metrics in boxes
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Box 1: Activity
    this.drawInfoBox(doc, 20, yPos, 50, 35, 'ACTIVIDAD', [
      `${totals.kmRecorridos} km recorridos`,
      `${totals.numeroCarreras} carreras`,
      `${stats.diasTrabajados} días trabajados`,
      `${stats.promedioKmDia.toFixed(1)} km/día promedio`
    ]);
    
    // Box 2: Income
    this.drawInfoBox(doc, 75, yPos, 50, 35, 'INGRESOS', [
      `${totals.gananciaBruta.toFixed(2)}€ brutos`,
      `${totals.gananciaNeta.toFixed(2)}€ netos`,
      `${stats.promedioGananciaDia.toFixed(2)}€/día`,
      `${stats.rentabilidadPorKm.toFixed(3)}€/km`
    ]);
    
    // Box 3: Efficiency
    this.drawInfoBox(doc, 130, yPos, 50, 35, 'EFICIENCIA', [
      `${stats.carrerasPorDia.toFixed(1)} carreras/día`,
      `${stats.ingresosPorCarrera.toFixed(2)}€/carrera`,
      `${stats.porcentajeComisiones.toFixed(1)}% comisiones`,
      `${stats.mejorDia.fecha} (mejor día)`
    ]);
    
    return yPos + 45;
  }

  addDetailedBreakdown(doc, totals) {
    let yPos = 170;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('💰 DESGLOSE DETALLADO DE INGRESOS', 20, yPos);
    yPos += 15;
    
    // Income breakdown table
    const incomeData = [
      ['Concepto', 'Importe', '% del Total'],
      ['Uber App', `${totals.uberApp.toFixed(2)}€`, `${((totals.uberApp / totals.gananciaBruta) * 100).toFixed(1)}%`],
      ['FreeNow App', `${totals.freeNowApp.toFixed(2)}€`, `${((totals.freeNowApp / totals.gananciaBruta) * 100).toFixed(1)}%`],
      ['FreeNow Tarjeta', `${totals.freeNowTarjeta.toFixed(2)}€`, `${((totals.freeNowTarjeta / totals.gananciaBruta) * 100).toFixed(1)}%`],
      ['FreeNow Efectivo', `${totals.freeNowEfectivo.toFixed(2)}€`, `${((totals.freeNowEfectivo / totals.gananciaBruta) * 100).toFixed(1)}%`],
      ['Taxi Tarjeta', `${totals.taxiTarjeta.toFixed(2)}€`, `${((totals.taxiTarjeta / totals.gananciaBruta) * 100).toFixed(1)}%`],
      ['Taxi Efectivo', `${totals.taxiEfectivo.toFixed(2)}€`, `${((totals.taxiEfectivo / totals.gananciaBruta) * 100).toFixed(1)}%`],
      ['TOTAL BRUTO', `${totals.gananciaBruta.toFixed(2)}€`, '100.0%']
    ];
    
    yPos = this.drawTable(doc, 20, yPos, incomeData, [60, 40, 30]);
    yPos += 15;
    
    // Deductions breakdown
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('📉 DEDUCCIONES Y GASTOS', 20, yPos);
    yPos += 10;
    
    const deductionsData = [
      ['Concepto', 'Importe', 'Descripción'],
      ['Comisión Vehículo', `-${totals.comisionVehiculo.toFixed(2)}€`, '52% sobre ingresos brutos'],
      ['Costo Kilometraje', `-${totals.costoKilometraje.toFixed(2)}€`, '0.05€ por kilómetro'],
      ['Comisión FreeNow Efectivo', `-${totals.comisionFreeNowEfectivo.toFixed(2)}€`, '6% sobre efectivo FreeNow'],
      ['Gastos Combustible', `+${totals.gastosCombustible.toFixed(2)}€`, 'Reembolso sin descuentos'],
      ['GANANCIA NETA', `${totals.gananciaNeta.toFixed(2)}€`, 'Beneficio final']
    ];
    
    yPos = this.drawTable(doc, 20, yPos, deductionsData, [60, 40, 60]);
    
    return yPos + 10;
  }

  addDailyBreakdown(doc, registros) {
    // Add new page if needed
    if (doc.internal.pageSize.height - 50 < 200) {
      doc.addPage();
      var yPos = 30;
    } else {
      var yPos = 240;
    }
    
    // Section title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('📅 DESGLOSE DIARIO', 20, yPos);
    yPos += 15;
    
    // Daily breakdown table (last 10 days)
    const recentRegistros = registros.slice(0, 10);
    const dailyData = [['Fecha', 'Km', 'Carreras', 'Ingresos', 'Ganancia Neta']];
    
    recentRegistros.forEach(registro => {
      const fecha = new Date(registro.fecha).toLocaleDateString('es-ES');
      const ingresos = (
        (parseFloat(registro.uber?.app || 0)) +
        (parseFloat(registro.freeNow?.app || 0)) +
        (parseFloat(registro.freeNow?.tarjeta || 0)) +
        (parseFloat(registro.freeNow?.efectivo || 0)) +
        (parseFloat(registro.taxiConvencional?.tarjeta || 0)) +
        (parseFloat(registro.taxiConvencional?.efectivo || 0))
      ).toFixed(2);
      
      dailyData.push([
        fecha,
        `${registro.kmRecorridos || 0}`,
        `${registro.numeroCarreras || 0}`,
        `${ingresos}€`,
        `${(registro.gananciaNeta || 0).toFixed(2)}€`
      ]);
    });
    
    if (recentRegistros.length > 0) {
      this.drawTable(doc, 20, yPos, dailyData, [35, 20, 25, 30, 35]);
    } else {
      doc.setFontSize(10);
      doc.text('No hay registros diarios para mostrar.', 25, yPos);
    }
  }

  addPerformanceAnalysis(doc, stats) {
    doc.addPage();
    let yPos = 30;
    
    // Section title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('📈 ANÁLISIS DE RENDIMIENTO', 20, yPos);
    yPos += 20;
    
    // Performance insights
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Insights Clave:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const insights = [
      `• Tu mejor día fue el ${stats.mejorDia.fecha} con ${stats.mejorDia.ganancia.toFixed(2)}€`,
      `• Promedio de ${stats.carrerasPorDia.toFixed(1)} carreras por día trabajado`,
      `• Rentabilidad de ${stats.rentabilidadPorKm.toFixed(3)}€ por kilómetro recorrido`,
      `• Las comisiones representan el ${stats.porcentajeComisiones.toFixed(1)}% de tus ingresos brutos`,
      `• Ganancia promedio por carrera: ${stats.ingresosPorCarrera.toFixed(2)}€`
    ];
    
    insights.forEach(insight => {
      doc.text(insight, 25, yPos);
      yPos += 8;
    });
    
    yPos += 10;
    
    // Recommendations
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Recomendaciones:', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const recommendations = this.generateRecommendations(stats);
    recommendations.forEach(rec => {
      doc.text(`• ${rec}`, 25, yPos);
      yPos += 8;
    });
  }

  addFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(79, 209, 199);
      doc.setLineWidth(0.5);
      doc.line(20, 280, 190, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Generado por Conductor Tracker - Aplicación de seguimiento profesional', 20, 285);
      doc.text(`Página ${i} de ${pageCount}`, 170, 285);
    }
  }

  // Helper methods
  drawInfoBox(doc, x, y, width, height, title, items) {
    // Box border
    doc.setDrawColor(79, 209, 199);
    doc.setLineWidth(1);
    doc.rect(x, y, width, height);
    
    // Title background
    doc.setFillColor(79, 209, 199);
    doc.rect(x, y, width, 8, 'F');
    
    // Title text
    doc.setTextColor(26, 31, 46);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(title, x + 2, y + 6);
    
    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    
    items.forEach((item, index) => {
      doc.text(item, x + 2, y + 15 + (index * 5));
    });
  }

  drawTable(doc, x, y, data, columnWidths) {
    const rowHeight = 7;
    let currentY = y;
    
    data.forEach((row, rowIndex) => {
      let currentX = x;
      
      // Header row styling
      if (rowIndex === 0) {
        doc.setFillColor(79, 209, 199);
        doc.rect(x, currentY - 5, columnWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        doc.setTextColor(26, 31, 46);
        doc.setFont(undefined, 'bold');
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
      }
      
      // Draw cells
      row.forEach((cell, colIndex) => {
        doc.setFontSize(9);
        doc.text(cell, currentX + 2, currentY);
        
        // Cell border
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(currentX, currentY - 5, columnWidths[colIndex], rowHeight);
        
        currentX += columnWidths[colIndex];
      });
      
      currentY += rowHeight;
    });
    
    return currentY;
  }

  calculateAdvancedStats(registros) {
    if (registros.length === 0) {
      return {
        diasTrabajados: 0,
        promedioKmDia: 0,
        promedioGananciaDia: 0,
        carrerasPorDia: 0,
        ingresosPorCarrera: 0,
        rentabilidadPorKm: 0,
        porcentajeComisiones: 0,
        mejorDia: { fecha: 'N/A', ganancia: 0 }
      };
    }

    const totals = this.calcService.calculateMonthlyTotals(registros);
    const diasTrabajados = registros.length;
    
    // Find best day
    const mejorRegistro = registros.reduce((best, current) => {
      return (current.gananciaNeta || 0) > (best.gananciaNeta || 0) ? current : best;
    });
    
    const totalComisiones = totals.comisionVehiculo + totals.costoKilometraje + totals.comisionFreeNowEfectivo;
    
    return {
      diasTrabajados,
      promedioKmDia: totals.kmRecorridos / diasTrabajados,
      promedioGananciaDia: totals.gananciaNeta / diasTrabajados,
      carrerasPorDia: totals.numeroCarreras / diasTrabajados,
      ingresosPorCarrera: totals.numeroCarreras > 0 ? totals.gananciaBruta / totals.numeroCarreras : 0,
      rentabilidadPorKm: totals.kmRecorridos > 0 ? totals.gananciaNeta / totals.kmRecorridos : 0,
      porcentajeComisiones: totals.gananciaBruta > 0 ? (totalComisiones / totals.gananciaBruta) * 100 : 0,
      mejorDia: {
        fecha: new Date(mejorRegistro.fecha).toLocaleDateString('es-ES'),
        ganancia: mejorRegistro.gananciaNeta || 0
      }
    };
  }

  generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.carrerasPorDia < 8) {
      recommendations.push('Considera aumentar el número de carreras diarias para mejorar ingresos');
    }
    
    if (stats.rentabilidadPorKm < 0.5) {
      recommendations.push('Optimiza las rutas para mejorar la rentabilidad por kilómetro');
    }
    
    if (stats.porcentajeComisiones > 60) {
      recommendations.push('Las comisiones son altas, considera negociar mejores condiciones');
    }
    
    if (stats.promedioKmDia > 200) {
      recommendations.push('Alto kilometraje diario, monitorea el desgaste del vehículo');
    }
    
    recommendations.push('Mantén un registro constante para identificar patrones de rentabilidad');
    
    return recommendations;
  }

  getPeriodInfo(period, customRange) {
    const now = new Date();
    
    switch (period) {
      case 'semanal':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        return {
          text: `Semana del ${startOfWeek.toLocaleDateString('es-ES')} al ${now.toLocaleDateString('es-ES')}`
        };
      
      case 'mensual':
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return {
          text: `${monthNames[now.getMonth()]} ${now.getFullYear()}`
        };
      
      case 'personalizado':
        if (customRange && customRange.desde && customRange.hasta) {
          return {
            text: `${customRange.desde} - ${customRange.hasta}`
          };
        }
        return { text: 'Período personalizado' };
      
      default:
        return { text: 'Período no especificado' };
    }
  }

  generateFilename(conductorName, period, customRange) {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    const cleanName = conductorName.replace(/\s+/g, '_');
    
    switch (period) {
      case 'semanal':
        return `Informe_Semanal_${timestamp}_${cleanName}.pdf`;
      case 'mensual':
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        return `Informe_${month}_${year}_${cleanName}.pdf`;
      case 'personalizado':
        return `Informe_Personalizado_${timestamp}_${cleanName}.pdf`;
      default:
        return `Informe_${timestamp}_${cleanName}.pdf`;
    }
  }

  // Specific monthly PDF generation as per requirements 10.1, 10.2, 10.3, 10.4, 10.5
  async generateMonthlyReport(registros) {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const conductor = await this.dbService.getConductor();
      const conductorName = conductor ? `${conductor.nombre} ${conductor.apellido}` : 'Conductor';
      
      // Calculate totals (excluding tips as per requirement 10.4)
      const totals = this.calcService.calculateMonthlyTotals(registros);
      
      // Add header with period and conductor name (Requirements 10.2, 10.3)
      this.addMonthlyHeader(doc, conductorName);
      
      // Add detailed content (Requirements 10.4, 10.5)
      this.addMonthlyContent(doc, totals);
      
      // Generate filename with format "Informe_MM_AAAA_Conductor.pdf" (Requirement 10.1)
      const filename = this.generateMonthlyFilename(conductorName);
      
      // Download PDF
      doc.save(filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error generating monthly PDF:', error);
      throw error;
    }
  }

  addMonthlyHeader(doc, conductorName) {
    const now = new Date();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('INFORME MENSUAL DE ACTIVIDAD', 20, 30);
    
    // Conductor name (Requirement 10.3)
    doc.setFontSize(14);
    doc.text(`Conductor: ${conductorName}`, 20, 45);
    
    // Period in dd/mm/yyyy format (Requirement 10.2)
    const startDate = `01/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const endDate = `${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    doc.text(`Período: ${startDate} - ${endDate}`, 20, 55);
    
    // Generation date
    doc.setFontSize(10);
    doc.text(`Generado: ${now.toLocaleDateString('es-ES')} a las ${now.toLocaleTimeString('es-ES')}`, 20, 65);
    
    // Separator line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 75, 190, 75);
  }

  addMonthlyContent(doc, totals) {
    let yPos = 90;
    
    // Monthly totals section (Requirement 10.4)
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTALES MENSUALES', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Activity metrics
    doc.text(`Km Recorridos: ${totals.kmRecorridos.toFixed(1)} km`, 25, yPos);
    yPos += 8;
    doc.text(`Número de Carreras: ${totals.numeroCarreras}`, 25, yPos);
    yPos += 15;
    
    // Income breakdown (excluding tips as per requirement 10.4)
    doc.setFont(undefined, 'bold');
    doc.text('INGRESOS POR CONCEPTO (excluyendo propinas):', 25, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Uber App: ${totals.uberApp.toFixed(2)}€`, 30, yPos);
    yPos += 8;
    doc.text(`FreeNow App: ${totals.freeNowApp.toFixed(2)}€`, 30, yPos);
    yPos += 8;
    doc.text(`FreeNow Tarjeta: ${totals.freeNowTarjeta.toFixed(2)}€`, 30, yPos);
    yPos += 8;
    doc.text(`FreeNow Efectivo: ${totals.freeNowEfectivo.toFixed(2)}€`, 30, yPos);
    yPos += 8;
    doc.text(`Taxi Convencional Tarjeta: ${totals.taxiTarjeta.toFixed(2)}€`, 30, yPos);
    yPos += 8;
    doc.text(`Taxi Convencional Efectivo: ${totals.taxiEfectivo.toFixed(2)}€`, 30, yPos);
    yPos += 8;
    doc.text(`Gastos de Combustible: ${totals.gastosCombustible.toFixed(2)}€`, 30, yPos);
    yPos += 20;
    
    // Mathematical operation breakdown (Requirements 10.5, 9.2)
    doc.setFont(undefined, 'bold');
    doc.text('CÁLCULO DETALLADO DE GANANCIA NETA:', 25, yPos);
    yPos += 15;
    
    doc.setFont(undefined, 'normal');
    
    // Step 1: Gross income
    doc.text(`1. Ganancia Bruta Total: ${totals.gananciaBruta.toFixed(2)}€`, 30, yPos);
    yPos += 10;
    
    // Step 2: Applied deductions
    doc.text('2. Descuentos Aplicados:', 30, yPos);
    yPos += 8;
    doc.text(`   - Comisión Vehículo (52%): ${totals.comisionVehiculo.toFixed(2)}€`, 35, yPos);
    yPos += 8;
    doc.text(`   - Costo Kilometraje (0.05€/km): ${totals.costoKilometraje.toFixed(2)}€`, 35, yPos);
    yPos += 8;
    doc.text(`   - Comisión FreeNow Efectivo (6%): ${totals.comisionFreeNowEfectivo.toFixed(2)}€`, 35, yPos);
    yPos += 10;
    
    // Step 3: Fuel expenses (added back)
    doc.text(`3. Gastos de Combustible (sin descuentos): +${totals.gastosCombustible.toFixed(2)}€`, 30, yPos);
    yPos += 15;
    
    // Step 4: Complete mathematical operation (Requirement 10.5)
    doc.setFont(undefined, 'bold');
    doc.text('OPERACIÓN MATEMÁTICA COMPLETA:', 30, yPos);
    yPos += 10;
    
    doc.setFont(undefined, 'normal');
    const operation = `${totals.gananciaBruta.toFixed(2)} - ${totals.comisionVehiculo.toFixed(2)} - ${totals.costoKilometraje.toFixed(2)} - ${totals.comisionFreeNowEfectivo.toFixed(2)} + ${totals.gastosCombustible.toFixed(2)} = ${totals.gananciaNeta.toFixed(2)}€`;
    doc.text(operation, 30, yPos);
    yPos += 15;
    
    // Final result
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`GANANCIA NETA FINAL: ${totals.gananciaNeta.toFixed(2)}€`, 30, yPos);
  }

  generateMonthlyFilename(conductorName) {
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const cleanName = conductorName.replace(/\s+/g, '_');
    
    // Format: "Informe_MM_AAAA_Conductor.pdf" (Requirement 10.1)
    return `Informe_${month}_${year}_${cleanName}.pdf`;
  }
}