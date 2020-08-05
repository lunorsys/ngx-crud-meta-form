import { NgModule, ModuleWithProviders, APP_INITIALIZER, LOCALE_ID } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PersistenceModule } from 'angular-persistence';
import { CrudService } from './services/crud.service';
import { AngularGlobalizeModule } from '@code-art/angular-globalize';
import { CommonModule } from '@angular/common';
import { BaseDataTableComponent } from './components/base-data-table/base-data-table.component';
import { CrudFieldsComponent } from './components/crud-fields/crud-fields.component';
import { CrudTableComponent } from './components/crud-table/crud-table.component';
import { CrudTableHeaderComponent } from './components/crud-table-header/crud-table-header.component';
import { CrudConfig } from './models/crud-config';
import { CrudLocalizeService } from './services/crud-localize.service';
import { CrudStylesComponent } from './components/crud-styles/crud-styles.component';
import { CrudFormComponent } from './components/crud-form/crud-form.component';
import { CrudObjectsService } from './services/crud-objects.service';
import { MetaInfoService } from './services/meta-info.service';
import { CrudFieldNumberComponent } from './components/crud-fields/crud-field-number/crud-field-number.component';
import { CrudFieldCheckboxComponent } from './components/crud-fields/crud-field-checkbox/crud-field-checkbox.component';
import { CrudFieldStringComponent } from './components/crud-fields/crud-field-string/crud-field-string.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTreeModule } from '@angular/material/tree';
import { CrudFieldSelectComponent } from './components/crud-fields/crud-field-select/crud-field-select.component';
import { CrudFieldSelectMultiObjectComponent } from './components/crud-fields/crud-field-select-multi-object/crud-field-select-multi-object.component';
import { CrudFieldChecklistObjectComponent } from './components/crud-fields/crud-field-checklist-object/crud-field-checklist-object.component';
import { CrudFieldChecklistComponent } from './components/crud-fields/crud-field-checklist/crud-field-checklist.component';
import { CrudFieldSelectMultiComponent } from './components/crud-fields/crud-field-select-multi/crud-field-select-multi.component';
import { CrudFieldTableMasterDetailComponent } from './components/crud-fields/crud-field-table-master-detail/crud-field-table-master-detail.component';
import { CrudFieldPlaceholderComponent } from './components/crud-fields/crud-field-placeholder/crud-field-placeholder.component';
import { CrudFieldTableComponent } from './components/crud-fields/crud-field-table/crud-field-table.component';
import { MessageDialogComponent } from './components/message-dialog/message-dialog.component';
import { MessageDialogService } from './services/message-dialog.service';
import { LocalConvertService } from './services/locale-convert.service';
import { CrudFieldDateComponent } from './components/crud-fields/crud-field-date/crud-field-date.component';
import { CrudFieldDatetimeComponent } from './components/crud-fields/crud-field-datetime/crud-field-datetime.component';
import { NgxMatDatetimePickerModule, NgxMatTimepickerModule, NgxMatNativeDateModule, NgxMatDateAdapter, NGX_MAT_DATE_FORMATS } from '@angular-material-components/datetime-picker';
import { NgxMatMomentModule } from '@angular-material-components/moment-adapter';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { LocalizeService } from './services/localize.service';
import { CrudDatetimeAdapter, CRUD_MOMENT_DATETIME_FORMATS } from './adapters/crud-moment-datetime-adapter';
import { CUSTOM_MOMENT_DATE_FORMATS, CrudDateAdapter } from './adapters/crud-moment-date-adapter';

@NgModule({
  declarations: [
    BaseDataTableComponent,
    // CrudFieldBaseComponent,
    CrudFieldCheckboxComponent,
    CrudFieldChecklistComponent,
    CrudFieldChecklistObjectComponent,
    CrudFieldDateComponent,
    CrudFieldDatetimeComponent,
    CrudFieldNumberComponent,
    CrudFieldPlaceholderComponent,
    CrudFieldSelectComponent,
    CrudFieldSelectMultiComponent,
    CrudFieldSelectMultiObjectComponent,
    CrudFieldStringComponent,
    CrudFieldTableComponent,
    CrudFieldTableMasterDetailComponent,
    CrudFieldsComponent,
    CrudFormComponent,
    CrudStylesComponent,
    CrudTableComponent,
    CrudTableHeaderComponent,
    MessageDialogComponent
  ],
  imports: [
    AngularGlobalizeModule, // Import this only in root app module
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    FlexLayoutModule,
    FormsModule,
    HttpClientModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatTreeModule,
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule,
    NgxMatMomentModule,
    PersistenceModule,
    ReactiveFormsModule,
    PersistenceModule,
    ReactiveFormsModule,
  ],
  providers: [
    MetaInfoService,
    CrudConfig,
    CrudLocalizeService,
    CrudObjectsService,
    CrudService,
    LocalConvertService,
    LocalizeService,
    MessageDialogService,
    {
      provide: NgxMatDateAdapter,
      useClass: CrudDatetimeAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS, CrudConfig]
    },
    {
      provide: NGX_MAT_DATE_FORMATS,
      useValue: CRUD_MOMENT_DATETIME_FORMATS
    },
    {
      provide: DateAdapter,
      useClass: CrudDateAdapter, // MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: CUSTOM_MOMENT_DATE_FORMATS
    },
    // {
    //   provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS,
    //   useValue: CustomMomentDateAdapterOptions
    // }
  ],
  exports: [
    BaseDataTableComponent,
    CrudFieldsComponent,
    CrudFormComponent,
    CrudTableComponent
  ],
  entryComponents: [],
})

export class NgxCrudMetaFormModule {
  public static forRoot(config: CrudConfig): ModuleWithProviders<NgxCrudMetaFormModule> {
    return {
      ngModule: NgxCrudMetaFormModule,
      providers: [
        {
          provide: CrudConfig,
          useValue: config
        },
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: initializeGlobalizeLibrary(),
          deps: [CrudLocalizeService, LOCALE_ID],
        }
      ]
    };
  }
}

export function initializeGlobalizeLibrary() {
  const setupFct = (crudLocalizeService: CrudLocalizeService) => crudLocalizeService.initializeGlobalizeLibrary();
  return setupFct;
}
