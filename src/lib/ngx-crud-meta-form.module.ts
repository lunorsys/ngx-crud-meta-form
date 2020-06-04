import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { PersistenceModule } from 'angular-persistence';
import { MetaInfoBaseService } from './services/meta-info-base.service';
import { MetaInfoExtraDataService } from './services/meta-info-extra-data.service';
import { CrudService } from './services/crud.service';
import { AngularGlobalizeModule } from '@code-art/angular-globalize';
import { CommonModule } from '@angular/common';
import { BaseDataTableComponent } from './components/base-data-table/base-data-table.component';
import { CrudFieldsComponent } from './components/crud-fields/crud-fields.component';
import { CrudTableComponent } from './components/crud-table/crud-table.component';
import { CrudTableHeaderComponent } from './components/crud-table-header/crud-table-header.component';
import { CRUD_CONFIG } from './models/crud-config';
import { CrudLocalizeService } from './services/crud-localize.service';
import { CrudStylesComponent } from './components/crud-styles/crud-styles.component';
import { CrudFormComponent } from './components/crud-form/crud-form.component';

@NgModule({
  declarations: [
    BaseDataTableComponent,
    CrudFieldsComponent,
    CrudFormComponent,
    CrudTableComponent,
    CrudTableHeaderComponent,
    CrudStylesComponent
  ],
  imports: [
    AngularGlobalizeModule.forRoot(), // Import this only in root app module
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
    PersistenceModule,
    ReactiveFormsModule,
  ],
  providers: [
    MetaInfoBaseService,
    MetaInfoExtraDataService,
    MetaInfoBaseService,
    CrudService,
    CrudLocalizeService
    // {
    //   provide: APP_INITIALIZER,
    //   multi: true,
    //   useFactory: (localizeService: CrudLocalizeService) => localizeService.initializeGlobalizeLibrary(),
    //   deps: [CrudLocalizeService, CRUD_CONFIG],
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
export class NgxCrudMetaFormModule { }
