package helpers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/cache"
	"github.com/byuoitav/pi-time/structs"
	"github.com/byuoitav/pi-time/ytimeapi"
)

// Punch will record a regular punch on the employee record and report up the websocket.
func Punch(byuID string, request structs.ClientPunchRequest) error {
	// build WSO2 request
	log.L.Debug("translating punch request")
	punchRequest := translateToPunch(request)

	// send WSO2 request to the YTime API
	log.L.Debug("sending punch request")
	timesheet, err := ytimeapi.SendPunchRequest(byuID, punchRequest)
	if err != nil {
		log.L.Error(err.Error())
		// TODO put it into the db to be posted later
	}

	// update the employee timesheet, which also sends it up the websocket
	log.L.Debug("updating employee timesheet")
	cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

	//update the punches and work order entries
	log.L.Debug("updating employee punches and work orders because a new punch happened")
	go cache.GetPossibleWorkOrders(byuID)
	go cache.GetPunchesForAllJobs(byuID)
	go cache.GetWorkOrderEntries(byuID)

	// if successful, return nil
	return nil
}

// LunchPunch will record a lunch punch on the employee record and report up the websocket.
func LunchPunch(byuID string, request structs.ClientLunchPunchRequest) error {
	// build WSO2 request
	punchRequest := translateToLunchPunch(request)

	// send WSO2 request to the YTime API
	timesheet, err := ytimeapi.SendLunchPunchRequest(byuID, punchRequest)
	if err != nil {
		return err
	}

	// update the employee timesheet, which also sends it up the websocket
	cache.UpdateEmployeeFromTimesheet(byuID, timesheet)

	//update the punches and work order entries
	log.L.Debug("updating employee punches and work orders because a new lunch punch happened")
	go cache.GetPossibleWorkOrders(byuID)
	go cache.GetPunchesForAllJobs(byuID)
	go cache.GetWorkOrderEntries(byuID)

	// if successful, return nil
	return nil
}

// OtherHours will record sick/vacation hours for the employee and report up the websocket.
func OtherHours(byuID string, request structs.ClientOtherHoursRequest) error {
	// build WSO2 request
	elapsed := translateToElapsedTimeEntry(request)

	// send WSO2 request to the YTime API
	summary, err := ytimeapi.SendOtherHoursRequest(byuID, elapsed)
	if err != nil {
		return err
	}

	//parse the date
	date, _ := time.ParseInLocation(summary.Dates[0].PunchDate, "2006-01-02", time.Local)

	// update the employee record, which also sends it up the websocket
	cache.UpdateOtherHoursForJobAndDate(byuID, request.EmployeeJobID, date, summary)

	// if successful, return nil
	return nil
}

// NewWorkOrderEntry will record a work order entry for the employee and report up the websocket.
func NewWorkOrderEntry(byuID string, jobID int, request structs.ClientWorkOrderEntry) error {
	// build WSO2 request
	entry := translateToWorkOrderEntry(request)

	// send WSO2 request to the YTime API
	summary, err := ytimeapi.SendNewWorkOrderEntryRequest(byuID, entry)
	if err != nil {
		return err
	}

	// update the employee record, which also sends it up the websocket
	cache.UpdateWorkOrderEntriesForJob(byuID, jobID, []structs.WorkOrderDaySummary{summary})

	// if successful, return nil
	return nil
}

// EditWorkOrderEntry will record a work order entry for the employee and report up the websocket.
func EditWorkOrderEntry(byuID string, jobID int, request structs.ClientWorkOrderEntry) error {
	// build WSO2 request
	entry := translateToWorkOrderEntry(request)

	// send WSO2 request to the YTime API
	summary, err := ytimeapi.SendEditWorkOrderEntryRequest(byuID, entry)
	if err != nil {
		return err
	}

	// update the employee record, which also sends it up the websocket
	cache.UpdateWorkOrderEntriesForJob(byuID, jobID, []structs.WorkOrderDaySummary{summary})

	// if successful, return nil
	return nil
}

// DeletePunch will delete a punch from the employee record and report up the websocket.
func DeletePunch(byuID string, jobID int, sequenceNumber string, request structs.ClientDeletePunch) error {
	// build WSO2 request
	jobIDstr := strconv.Itoa(jobID)

	t, gerr := time.ParseInLocation("Mon Jan 2 2006", request.PunchDate, time.Local)
	if gerr != nil {
		log.L.Error("crap")
		return gerr
	}

	// send WSO2 request to the YTime API
	responseArray, err := ytimeapi.SendDeletePunchRequest(byuID, jobIDstr, t.Format("2006-01-02"), sequenceNumber)
	if err != nil {
		log.L.Error(err)
		return fmt.Errorf(err.Error())
	}

	// update the employee timesheet, which also sends it up the websocket
	cache.DeletePunchForJob(byuID, jobID, request.PunchDate, responseArray)

	// if successful, return nil
	return nil
}

// DeleteWorkOrderEntry deletes a work order entry and reports to the websocket
func DeleteWorkOrderEntry(byuID string, request structs.ClientDeleteWorkOrderEntry) error {
	//send WSO2 request
	id := strconv.Itoa(request.JobID)
	seqNum := strconv.Itoa(request.SequenceNumber)

	response, err := ytimeapi.SendDeleteWorkOrderEntryRequest(byuID, id, request.Date, seqNum)
	if err != nil {
		log.L.Error(err)
		return fmt.Errorf(err.Error())
	}
	var array []structs.WorkOrderDaySummary
	array = append(array, response)
	//update the employee timesheet, which also sends it up the websocket
	cache.UpdateWorkOrderEntriesForJob(byuID, request.JobID, array)

	//if successful return nil
	return nil
}
