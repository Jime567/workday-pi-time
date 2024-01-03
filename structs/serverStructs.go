// package structs

// import (
// 	"encoding/json"
// 	"errors"
// )

// //This file is all of the structs that will come back from the WSO2 services

// // Timesheet gives all data about the current clock state for an employee and his/her jobs
// type Timesheet struct {
// 	//BYUID is the byu id
// 	BYUID string `json:"byu_id"`

// 	//PersonName is the person's name in Last, First format
// 	PersonName string `json:"person_name"`

// 	//WeeklyTotal is the total hours worked so far in the week in format h:mm (string)
// 	WeeklyTotal string `json:"weekly_total"`

// 	//PeriodTotal is the total hours worked so far in the pay period in format h:mm (string)
// 	PeriodTotal string `json:"period_total"`

// 	//Jobs is the array containing current clock intformation about each job
// 	Jobs []Job `json:"jobs"`

// 	//InternationalMessage is used to indicate that a warning should be shown to the user due to hour working limits
// 	InternationalMessage string `json:"international_message"`

// 	// International is going away in a new version of the api
// 	International bool `json:"international"`
// }

// // EmployeeCache is the cache list
// type EmployeeCache struct {
// 	Employees []EmployeeRecord `json:"employees"`
// }

// // EmployeeRecord comes back in the cache list
// type EmployeeRecord struct {
// 	BYUID string `json:"byu_id"`
// 	NETID string `json:"net_id"`
// 	Jobs  []Job  `json:"jobs"`
// 	Name  string `json:"sort_name"`
// }

// // Job represents the current state of an employee's job
// type Job struct {
// 	JobCodeDesc           string    `json:"job_code_description"`
// 	PunchType             string    `json:"punch_type"`
// 	EmployeeRecord        int       `json:"employee_record"`
// 	WeeklySubtotal        string    `json:"weekly_subtotal"`
// 	PeriodSubtotal        string    `json:"period_subtotal"`
// 	PhysicalFacilities    *bool     `json:"physical_facilities,omitempty"`
// 	OperatingUnit         string    `json:"operating_unit"`
// 	TRCs                  []TRC     `json:"trcs"`
// 	CurrentWorkOrder      WorkOrder `json:"current_work_order"`
// 	CurrentTRC            TRC       `json:"current_trc"`
// 	FullPartTime          string    `json:"full_part_time"`
// 	HasPunchException     *bool     `json:"has_punch_exception,omitempty"`
// 	HasWorkOrderException *bool     `json:"has_work_order_exception,omitempty"`
// }

// func (j *Job) UnmarshalJSON(data []byte) error {
// 	type Alias Job
// 	aux := &struct {
// 		PhysicalFacilities string `json:"physical_facilities,omitempty"`
// 		*Alias
// 	}{
// 		Alias: (*Alias)(j),
// 	}

// 	if err := json.Unmarshal(data, &aux); err != nil {
// 		var jerr *json.UnmarshalTypeError

// 		if errors.As(err, &jerr) && jerr.Field == "physical_facilities" && jerr.Value == "bool" {
// 			aux2 := &struct {
// 				*Alias
// 			}{
// 				Alias: (*Alias)(j),
// 			}

// 			if err := json.Unmarshal(data, aux2); err != nil {
// 				return err
// 			}
// 			return nil
// 		}
// 	}

// 	if aux.PhysicalFacilities == "N" {
// 		j.PhysicalFacilities = newFalse()
// 	} else {
// 		j.PhysicalFacilities = newTrue()
// 	}
// 	return nil

// }

// func newTrue() *bool {
// 	b := true
// 	return &b
// }

// func newFalse() *bool {
// 	b := false
// 	return &b
// }

// // TRC is a code for the type of hours that an employee can punch in under
// type TRC struct {
// 	TRCID          string `json:"trc_id"`
// 	TRCDescription string `json:"trc_description"`
// }

// // WorkOrder is ID and description for a work order
// type WorkOrder struct {
// 	WorkOrderID          string `json:"work_order_id"`
// 	WorkOrderDescription string `json:"work_order_description"`
// }

// // TimeClockDay represents a day with activity on the clock
// type TimeClockDay struct {
// 	Date                  string  `json:"date"`
// 	HasPunchException     *bool   `json:"has_punch_exception,omitempty"`
// 	HasWorkOrderException *bool   `json:"has_work_order_exception,omitempty"`
// 	Punches               []Punch `json:"punches"`
// 	PunchedHours          string  `json:"punched_hours"`
// }

// type BucketStatus struct {
// 	PendingBucket  int
// 	ErrorBucket    int
// 	EmployeeBucket int
// }

// // Punch represents a single punch in or out for an employee
// // type Punch struct {
// // 	PunchType            string  `json:"punch_type"`
// // 	PunchTime            string  `json:"punch_time"`
// // 	SequenceNumber       *int    `json:"sequence_number,omitempty"`
// // 	DeletablePair        *int    `json:"deletable_pair,omitempty"`
// // 	Latitude             *string `json:"latitude,omitempty"`
// // 	Longitude            *string `json:"longitude,omitempty"`
// // 	LocationDescription  *string `json:"location_description,omitempty"`
// // 	TimeCollectionSource *string `json:"time_collection_source,omitempty"`
// // 	WorkOrderID          *string `json:"work_order_id,omitempty"`
// // 	TRCID                *string `json:"trc_id,omitempty"`
// // 	PunchDate            *string `json:"punch_date,omitempty"`
// // 	EmployeeRecord       *int    `json:"employee_record,omitempty"`
// // 	PunchZone            *string `json:"punch_zone,omitempty"`
// // 	InternetAddress      *string `json:"internet_address,omitempty"`
// // }

// type Punch struct {
// 	Worker_ID                  string `json:"worker_id"`
// 	Position_Number            string `json:"position_number"`
// 	Clock_Event_Type           string `json:"clock_event_type"`
// 	Time_Entry_Code            string `json:"time_entry_code"`
// 	Comment                    string `json:"comment"`
// 	Time_Clock_Event_Date_Time string `json:"time_clock_event_date_time"`
// }

// // WorkOrderDaySummary is returned when querying a date for work orders logged on that date
// type WorkOrderDaySummary struct {
// 	Date                    string           `json:"punch_date"`
// 	WorkOrderEntries        []WorkOrderEntry `json:"work_order_entries"`
// 	ReportedHours           string           `json:"reported_hours"`
// 	PhysicalFacilitiesHours string           `json:"physical_facilities_hours"`
// 	OtherHours              string           `json:"other_hours"`
// 	HasPunchException       *bool            `json:"has_punch_exception,omitempty"`
// 	HasWorkOrderException   *bool            `json:"has_work_order_exception,omitempty"`
// }

// // WorkOrderEntry represents a single work order logged for part of a day
// type WorkOrderEntry struct {
// 	WorkOrder              WorkOrder `json:"work_order"`
// 	TRC                    TRC       `json:"trc"`
// 	TimeReportingCodeHours string    `json:"time_reporting_code_hours"`
// 	SequenceNumber         int       `json:"sequence_number"`
// 	Editable               bool      `json:"editable"`

// 	//these only used when posting
// 	EmployeeRecord int `json:"employee_record"`
// }

// // ElapsedTimeSummary is the parent structure for sick and vacation hours
// type ElapsedTimeSummary struct {
// 	SickLeaveBalanceHours     string           `json:"sick_leave_balance_hours"`
// 	VacationLeaveBalanceHours string           `json:"vacation_leave_balance_hours"`
// 	Dates                     []ElapsedTimeDay `json:"elapsed_time_dates"`
// }

// // ElapsedTimeDay is the parent structure for sick and vacation hours for a day
// type ElapsedTimeDay struct {
// 	PunchDate          string             `json:"punch_date"`
// 	ElapsedTimeEntries []ElapsedTimeEntry `json:"punches"`
// }

// // ElapsedTimeEntry is the structure for a single amount of sick or vacation time
// type ElapsedTimeEntry struct {
// 	//these only come back when GETTING
// 	Editable *bool `json:"editable,omitempty"`
// 	TRC      TRC   `json:"trc"`

// 	//these come back for GET and are used on POST
// 	TimeReportingCodeHours string `json:"time_reporting_code_hours"`
// 	SequenceNumber         int    `json:"sequence_number"`
// 	EmployeeRecord         int    `json:"employee_record"`

// 	//POST only
// 	PunchDate            string `json:"punch_date"`
// 	TRCID                string `json:"trc_id"`
// 	TimeCollectionSource string `json:"time_collection_source"`
// }

// // ElapsedTimeEntryWrapper is th structure to use when POSTING sick or vacation
// type ElapsedTimeEntryWrapper struct {
// 	ElapsedTimeEntry ElapsedTimeEntry `json:"elapsed_time_entry"`
// }

// // DeleteWorkOrderEntry .
// type DeleteWorkOrderEntry struct {
// 	JobID          int    `json:"employee-job-id"`
// 	Date           string `json:"date"`
// 	SequenceNumber int    `json:"sequence-number"`
// }

// // YTimeLocation .
// type YTimeLocation struct {
// 	YtimeLocation             string      `json:"ytime_location"`
// 	UpdatedByName             string      `json:"updated_by_name"`
// 	LocationSource            string      `json:"location_source"`
// 	YtimeLocationCode         string      `json:"ytime_location_code"`
// 	UpdatedDatetime           interface{} `json:"updated_datetime"`
// 	Latitude                  float64     `json:"latitude"`
// 	YtimeLocationAbbreviation string      `json:"ytime_location_abbreviation"`
// 	Status                    string      `json:"status"`
// 	Longitude                 float64     `json:"longitude"`
// }

// // ServerErrorMessage .
// type ServerErrorMessage struct {
// 	Message string `json:"message"`
// }

// // ServerLoginErrorMessage .
// type ServerLoginErrorMessage struct {
// 	Status struct {
// 		Code    string `json:"code"`
// 		Message string `json:"message"`
// 	}
// }

// // ********************************************Workday*********************************************************************************
// type WorkerSummaryResponse struct {
// 	Info WorkerSummaryInfo   `json:"info"`
// 	Data []WorkerSummaryData `json:"data"`
// }

// type WorkerPositionResponse struct {
// 	Info WorkerSummaryInfo    `json:"info"`
// 	Data []WorkerPositionData `json:"data"`
// }

// type WorkerSummaryInfo struct {
// 	Collection_Size int                     `json:"collection_size"`
// 	Paging          WorkerSummaryInfoPaging `json:"paging"`
// }

// type WorkerSummaryInfoPaging struct {
// 	Page_size       int    `json:"page_size"`
// 	Next_identifier string `json:"next_identifier"`
// }

// type WorkerSummaryData struct {
// 	Worker_ID                                       string `json:"worker_id"`
// 	First_Name                                      string `json:"first_name"`
// 	Middle_Name                                     string `json:"middle_name"`
// 	Last_name                                       string `json:"last_name"`
// 	Social_Suffix                                   string `json:"social_suffix"`
// 	Preferred_first_name                            string `json:"preferred_first_name"`
// 	Preferred_middle_name                           string `json:"preferred_middle_name"`
// 	Preferred_last_name                             string `json:"preferred_last_name"`
// 	Company_id                                      string `json:"company_id"`
// 	Company_name                                    string `json:"company_name"`
// 	Worker_type_reference_id                        string `json:"worker_type_reference_id"`
// 	Worker_type                                     string `json:"worker_type"`
// 	Is_active                                       bool   `json:"is_active"`
// 	Continuous_service_date                         string `json:"continuous_service_date"`
// 	Termination_date                                string `json:"termination_date"`
// 	Time_off_service_date                           string `json:"time_off_service_date"`
// 	Work_phone_number                               string `json:"work_phone_number"`
// 	Work_email_address                              string `json:"work_email_address"`
// 	Is_retired                                      bool   `json:"is_retired"`
// 	Position_number                                 string `json:"position_number"`
// 	Primary_position                                bool   `json:"primary_position"`
// 	Job_profile_reference_id                        string `json:"job_profile_reference_id"`
// 	Job_profile                                     string `json:"job_profile"`
// 	Management_level_reference_id                   string `json:"management_level_reference_id"`
// 	Management_level                                string `json:"management_level"`
// 	Management_level_number                         int    `json:"management_level_number"`
// 	Business_title                                  string `json:"business_title"`
// 	Employee_or_contingent_worker_type_reference_id string `json:"employee_or_contingent_worker_type_reference_id"`
// 	Employee_or_contingent_worker_type              string `json:"employee_or_contingent_worker_type"`
// 	Time_type_reference_id                          string `json:"time_type_reference_id"`
// 	Time_type                                       string `json:"time_type"`
// 	Fte_percentage                                  string `json:"fte_percentage"`
// 	Manager_id                                      string `json:"manager_id"`
// 	Manager_name                                    string `json:"manager_name"`
// 	Supervisory_org_reference_id                    string `json:"supervisory_org_reference_id"`
// 	Supervisory_org                                 string `json:"supervisory_org"`
// 	Supervisory_org_parent_reference_id             string `json:"supervisory_org_parent_reference_id"`
// 	Supervisory_org_parent                          string `json:"supervisory_org_parent"`
// 	Work_space                                      string `json:"work_space"`
// 	Position_entry_date                             string `json:"position_entry_date"`
// 	Position_exit_date                              string `json:"position_exit_date"`
// 	Is_active_position                              string `json:"is_active_position"`
// }

// type WorkerPositionData struct {
// 	Worker_id                                       string `json:"worker_id"`
// 	Position_number                                 string `json:"position_number"`
// 	Primary_position                                bool   `json:"primary_position"`
// 	Job_profile_reference_id                        string `json:"job_profile_reference_id"`
// 	Job_profile                                     string `json:"job_profile"`
// 	Management_level_reference_id                   string `json:"management_level_reference_id"`
// 	Management_level                                string `json:"management_level"`
// 	Management_level_number                         int    `json:"management_level_number"`
// 	Business_title                                  string `json:"business_title"`
// 	Employee_or_contingent_worker_type              string `json:"employee_or_contingent_worker_type"`
// 	Employee_or_contingent_worker_type_reference_id string `json:"employee_or_contingent_worker_type_reference_id"`
// 	Time_type_reference_id                          string `json:"time_type_reference_id"`
// 	Time_type                                       string `json:"time_type"`
// 	Fte_percentage                                  string `json:"fte_percentage"`
// 	Manager_id                                      string `json:"manager_id"`
// 	Manager_name                                    string `json:"manager_name"`
// 	Supervisory_org_reference_id                    string `json:"supervisory_org_reference_id"`
// 	Supervisory_org                                 string `json:"supervisory_org"`
// 	Supervisory_org_parent_reference_id             string `json:"supervisory_org_parent_reference_id"`
// 	Supervisory_org_parent                          string `json:"supervisory_org_parent"`
// 	Work_space                                      string `json:"work_space"`
// 	Position_entry_date                             string `json:"position_entry_date"`
// 	Position_exit_date                              string `json:"position_exit_date"`
// 	Is_active_position                              bool   `json:"is_active_position"`
// 	Updated_at                                      string `json:"updated_at"`
// }
