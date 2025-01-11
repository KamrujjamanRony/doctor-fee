import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { SearchComponent } from '../../../shared/svg/search/search.component';
import { CommonModule, DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PatientService } from '../../../../services/patient.service';
import { DoctorService } from '../../../../services/doctor.service';
import { DoctorFeeFeeService } from '../../../../services/doctor-fee.service';
import { DataFetchService } from '../../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-doctor-fee-report',
  standalone: true,
  imports: [SearchComponent, CommonModule, FormsModule],
  templateUrl: './doctor-fee-report.component.html',
  styleUrl: './doctor-fee-report.component.css'
})
export class DoctorFeeReportComponent {
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private doctorFeeService = inject(DoctorFeeFeeService);
  dataFetchService = inject(DataFetchService);
  filteredPatientList = signal<any[]>([]);
  filteredDoctorList = signal<any[]>([]);
  filteredDoctorFeeList = signal<any[]>([]);
  DoctorFeeList = signal<any[]>([]);
  filteredDoctorOptions = signal<any[]>([]);
  query: any = '';
  fromDate: any;
  toDate: any;
  nextFollowDate: any;
  selectedDoctor: any = '';
  marginTop: any = 0;
  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  ngOnInit() {
    const today = new Date();
    this.fromDate = today.toISOString().split('T')[0];
    // this.toDate = today.toISOString().split('T')[0];
    this.onLoadPatients();
    this.onLoadDoctors();
    this.onFilterData();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 10);
  }

  onLoadPatients() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.patientService.getAllPatients());
    data$.subscribe(data => {
      this.filteredPatientList.set(data);
    });
  }

  onLoadDoctors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getAllDoctors());
    data$.subscribe(data => {
      this.filteredDoctorList.set(data.sort((a, b) => a.name - b.name));
    });
  }

  // onLoadDoctorFees() {
  //   const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getAllDoctorFees());
  //   data$.subscribe(data => {
  //     this.DoctorFeeList.set(data);
  //     this.filteredDoctorFeeList.set(data);
  //   });
  //   this.isLoading$ = isLoading$;
  //   this.hasError$ = hasError$;
  //   combineLatest([data$, this.searchQuery$]).pipe(
  //     map(([data, query]) => {
  //       console.log(query)
  //       if (!query.trim()) {
  //         return data;
  //       }
  //       return data.filter((mainData: any) => {
  //         return (
  //           mainData.regNo?.toLowerCase()?.includes(query) ||
  //           mainData.patientName?.toLowerCase()?.includes(query) ||
  //           mainData.contactNo?.toLowerCase()?.includes(query) ||
  //           mainData.remarks?.toLowerCase()?.includes(query) ||
  //           mainData.postBy?.toLowerCase()?.includes(query) ||
  //           mainData.patientType?.toLowerCase()?.includes(query) ||
  //           mainData.doctorName?.toLowerCase()?.includes(query)
  //         );
  //       });
  //     })
  //   ).subscribe(filteredData => {
  //     this.filteredDoctorFeeList.set(filteredData);
  //     this.DoctorFeeList.set(filteredData);
  //     const uniqueDoctors = Array.from(new Map(filteredData.map((d: any) => [d.doctorId, { id: d.doctorId, name: d.doctorName }])).values());
  //     this.filteredDoctorOptions.set(uniqueDoctors);
  //   });
  // }

  onFilterData() {
    if (this.nextFollowDate) {
      this.fromDate = "";
      this.toDate = "";
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getFilteredDoctorFee(this.fromDate, this.toDate, this.nextFollowDate));
    data$.subscribe(data => {
      this.DoctorFeeList.set(data);
      this.filteredDoctorFeeList.set(data);
      // Create a unique list of doctor options
      const uniqueDoctors = Array.from(new Map(data.map((d: any) => [d.doctorId, { id: d.doctorId, name: d.doctorName }])).values());
      // Set unique doctor options
      this.filteredDoctorOptions.set(uniqueDoctors);
    });
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    combineLatest([data$, this.searchQuery$]).pipe(
      map(([data, query]) => {
        if (!query.trim()) {
          return data;
        }
        return data.filter((mainData: any) => {
          return (
            mainData.regNo?.toLowerCase()?.includes(query) ||
            mainData.patientName?.toLowerCase()?.includes(query) ||
            mainData.contactNo?.toLowerCase()?.includes(query) ||
            mainData.remarks?.toLowerCase()?.includes(query) ||
            mainData.postBy?.toLowerCase()?.includes(query) ||
            mainData.patientType?.toLowerCase()?.includes(query) ||
            mainData.doctorName?.toLowerCase()?.includes(query)
          );
        });
      })
    ).subscribe(filteredData => {
      this.filteredDoctorFeeList.set(filteredData);
      this.DoctorFeeList.set(filteredData);
      const uniqueDoctors = Array.from(new Map(filteredData.map((d: any) => [d.doctorId, { id: d.doctorId, name: d.doctorName }])).values());
      this.filteredDoctorOptions.set(uniqueDoctors);
    });
  }

  onSelectInputChange(): void {
    this.filteredDoctorFeeList.set(this.DoctorFeeList());
    if (!this.selectedDoctor.trim()) {
      return;
    }
    const filteredDoctorFees = this.filteredDoctorFeeList().filter(fee => fee.doctorId == this.selectedDoctor);
    this.filteredDoctorFeeList.set(filteredDoctorFees);
  }

  // Method to filter DoctorFee list based on search query
  onSearchDoctorFee(event: Event) {
    this.query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(this.query);
  }

  getPatientName(id: any) {
    const patient = this.filteredPatientList().find(p => p.id == id);
    return patient?.name ?? '';
  }

  getDoctorName(id: any) {
    const doctor = this.filteredDoctorList().find(p => p.id == id);
    return doctor?.name ?? '';
  }

  handleClearFilter() {
    this.searchQuery$.next("");
    this.searchInput.nativeElement.value = "";
    const today = new Date();
    this.fromDate = today.toISOString().split('T')[0];
    this.toDate = '';
    this.nextFollowDate = '';
    this.selectedDoctor = '';
    this.onFilterData()
  }

  // generatePDF() {
  // // Set initial margins and page dimensions
  // const pageSizeWidth = 210;
  // const pageSizeHeight = 297;
  // const marginLeft = 10;
  // let marginTop = this.marginTop + 10;
  // const marginBottom = 10;
  // const marginRight = 10;

  //   const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });
  
  //   // Adjust margin based on conditions
  //   if (this.selectedDoctor) {
  //     marginTop += 5; // Add extra margin if doctor is selected
  //   }
  
  //   if (this.nextFollowDate || this.fromDate) {
  //     marginTop += 4; // Add more space for additional information
  //   }
  
  //   // Render the header dynamically
  //   const pageWidth = doc.internal.pageSize.width - marginLeft - marginRight;
  
  //   // Main Report Title
  //   doc.setFontSize(14);
  //   doc.setFont('helvetica', 'bold');
  //   doc.text('Doctor Fee Report', pageWidth / 2, marginTop, {
  //     align: 'center',
  //   });
  
  //   // Adjust for additional text below the title
  //   if (this.selectedDoctor) {
  //     doc.setFontSize(10);
  //     doc.text(
  //       `${this.getDoctorName(this.selectedDoctor)}`,
  //       pageWidth / 2,
  //       marginTop + 4,
  //       { align: 'center' }
  //     );
  //     marginTop += 5;
  //   }
  
  //   if (this.nextFollowDate) {
  //     doc.setFontSize(8);
  //     doc.text(
  //       `Next Follow Date: ${this.transform(this.nextFollowDate)}`,
  //       pageWidth / 2,
  //       marginTop + 3,
  //       { align: 'center' }
  //     );
  //     marginTop += 4;
  //   } else if (this.fromDate) {
  //     doc.setFontSize(8);
  //     doc.text(
  //       `From: ${this.transform(this.fromDate)} to: ${
  //         this.toDate ? this.transform(this.toDate) : this.transform(this.fromDate)
  //       }`,
  //       pageWidth / 2,
  //       marginTop + 3,
  //       { align: 'center' }
  //     );
  //     marginTop += 4;
  //   }
  
  //   // Table data preparation
  //   const dataRows = this.filteredDoctorFeeList().map((data: any, sl: number) => [
  //     sl + 1,
  //     this.getPatientName(data?.patientRegId),
  //     data?.regNo,
  //     data?.contactNo,
  //     data?.patientType,
  //     data?.amount.toFixed(0),
  //     data?.discount.toFixed(0),
  //     this.transform(data?.nextFlowDate, "dd/MM/yyyy"),
  //     data?.remarks,
  //   ]);
  
  //   const totalAmount = this.filteredDoctorFeeList().reduce(
  //     (sum: number, data: any) => sum + data.amount,
  //     0
  //   );
  
  //   const totalDiscount = this.filteredDoctorFeeList().reduce(
  //     (sum: number, data: any) => sum + data.discount,
  //     0
  //   );
  
  //   // Render the table starting below the header
  //   (doc as any).autoTable({
  //     // didDrawCell: () => {
  //     //   var base64Img = 'data:image/jpeg;base64,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oJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoNTD81M3RB/7rti9G9wf/+Ijo/mO3vCG6v+q2w9H9Dx5cHN0/Zc6e6P70186I7q869sbo/l1bPx7dP2PeX0f33//1d0X3P/+xs6L7ixZ8M7q/cM8no/s/XHIouu8CACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKDcw9f3H0gQt+9+Ho/vh3z4zuLznv2uj+a390e3T/4Mbo/Kib/ncwuv/4D8+J7j/4ltdH95/8zs7o/ss3/lt0/2uLn4/uL1h/anT/2C9lv99d542N7i/6++9F910AAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAECpgTft3Rl9YP8x747un3zOidH9BRN3RPdP33RydP+EMdn/5+DXPhPdf3H99uj+TZfPjO7POua+6P6SndOj+7//d3dF9x868uXo/mVT1kX3r3jdxOj+zX/7qei+CwCglAAAlBIAgFICAFBKAABKCQBAKQEAKCUAAKUEAKCUAACUEgCAUgIAUEoAAEoJAEApAQAoJQAApQQAoJQAAJQSAIBSAgBQSgAASgkAQCkBACglAAClBACglAAAlBIAgFICAFBKAABKCQBAKQEAKPV/AQAA//8HPZBzzBtiwAAAAABJRU5ErkJggg=='
  //     //   doc.addImage(base64Img, 'JPEG', 14, 5, 182, 40);
  //     // },
  //     head: [['SL', 'Patient', 'Reg No', 'Contact No', 'Type', 'Amount', 'Discount', 'Next Follow Date', 'Remarks']],
  //     body: dataRows,
  //     theme: 'grid',
  //     startY: marginTop + 2, // Adjust the table's start position
  //     headStyles: {
  //       fillColor: [102, 255, 102],
  //       textColor: [0, 0, 0],
  //       fontSize: 8,
  //     },
  //     styles: {
  //       lineWidth: 0.2,
  //       lineColor: [0, 0, 0],
  //       halign: 'center',
  //       fontSize: 8,
  //     },
  //     foot: [
  //       [
  //         '',
  //         '',
  //         '',
  //         '',
  //         '',
  //         totalAmount.toFixed(0),
  //         totalDiscount.toFixed(0),
  //         '',
  //         '',
  //       ],
  //     ],
  //     footStyles: {
  //       fillColor: [102, 255, 255],
  //       textColor: [0, 0, 0],
  //       fontStyle: 'bold',
  //     },
  //     columnStyles: {
  //       0: { halign: 'center' },
  //       1: { halign: 'left' },
  //     },
  //   });
    
  //   const finalY = (doc as any).lastAutoTable.finalY + 5;
  //   doc.setFontSize(10);
  //   doc.text(
  //     `Total Collection (${totalAmount} - ${totalDiscount}) = ${totalAmount - totalDiscount} Tk`,
  //     105,
  //     finalY,
  //     { align: 'center' }
  //   );

  //   doc.output('dataurlnewwindow');
  // }

generatePDF() {
  const pageSizeWidth = 210;
  const pageSizeHeight = 297;
  const marginLeft = 10;
  const marginRight = 10;
  let marginTop = this.marginTop + 10;
  const marginBottom = 10;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });

  // Adjust margins based on conditions
  if (this.selectedDoctor) {
    marginTop += 5;
  }
  if (this.nextFollowDate || this.fromDate) {
    marginTop += 4;
  }

  // Title and Header Section
  const pageWidth = doc.internal.pageSize.width - marginLeft - marginRight;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Doctor Fee Report', pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
  marginTop += 8;

  // Sub-header for doctor name and dates
  doc.setFontSize(10);
  if (this.selectedDoctor) {
    doc.text(`Doctor: ${this.getDoctorName(this.selectedDoctor)}`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
    marginTop += 5;
  }
  if (this.nextFollowDate) {
    doc.text(`Next Follow Date: ${this.transform(this.nextFollowDate)}`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
    marginTop += 4;
  } else if (this.fromDate) {
    const dateRange = `From: ${this.transform(this.fromDate)} to: ${
      this.toDate ? this.transform(this.toDate) : this.transform(this.fromDate)
    }`;
    doc.text(dateRange, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
    marginTop += 4;
  }

  // Prepare Table Data
  const dataRows = this.filteredDoctorFeeList().map((data: any) => [
    data?.sl,
    this.getPatientName(data?.patientRegId),
    data?.regNo || '',
    data?.contactNo || '',
    data?.patientType || '',
    data?.amount.toFixed(0) || 0,
    data?.discount.toFixed(0) || 0,
    this.transform(data?.nextFlowDate, 'dd/MM/yyyy') || '',
    data?.remarks || '',
  ]);

  const totalAmount = this.filteredDoctorFeeList().reduce((sum: number, data: any) => sum + (data.amount || 0), 0);
  const totalDiscount = this.filteredDoctorFeeList().reduce((sum: number, data: any) => sum + (data.discount || 0), 0);

  // Render Table
  (doc as any).autoTable({
    head: [['SL', 'Patient', 'Reg No', 'Contact No', 'Type', 'Amount', 'Discount', 'Next Follow Date', 'Remarks']],
    body: dataRows,
    foot: [
      [
        '', '', '', '', '',
        totalAmount.toFixed(0),
        totalDiscount.toFixed(0),
        '', ''
      ],
    ],
    theme: 'grid',
    startY: marginTop + 5,
    styles: {
      textColor: 0,
      cellPadding: 2,
      lineColor: 0,
      fontSize: 8,
      valign: 'middle',
      halign: 'center',
    },
    headStyles: {
      fillColor: [102, 255, 102],
      textColor: 0,
      lineWidth: 0.2,
      lineColor: 0,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [102, 255, 255],
      textColor: 0,
      lineWidth: 0.2,
      lineColor: 0,
      fontStyle: 'bold',
    },
    margin: { top: marginTop, left: marginLeft, right: marginRight },
    didDrawPage: (data: any) => {
      // Add Footer with Margin Bottom
      doc.setFontSize(8);
      doc.text(``, pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, {
        align: 'right',
      });
    },
  });

  
    
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.text(
      `Total Collection (${totalAmount} - ${totalDiscount}) = ${totalAmount - totalDiscount} Tk`,
      105,
      finalY,
      { align: 'center' }
    );

  doc.output('dataurlnewwindow');
}




  
  

}
