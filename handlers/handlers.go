package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/byuoitav/common/log"
	commonEvents "github.com/byuoitav/common/v2/events"
	"github.com/byuoitav/pi-time/cache"
	eventsender "github.com/byuoitav/pi-time/events"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/byuoitav/pi-time/structs"
	"github.com/labstack/echo"
)

// Punch adds an in or out punch as determined by the body sent
func Punch(context echo.Context) error {
	byuID := context.Param("id")

	var incomingRequest structs.ClientPunchRequest
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	//call the helper
	err = helpers.Punch(byuID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

// LunchPunch adds a lunch punch
func LunchPunch(context echo.Context) error {
	//byu id passed in the url
	byuID := context.Param("id")

	//the body needs to be a ClientLunchPunchRequest struct
	var incomingRequest structs.ClientLunchPunchRequest
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	//call the helper
	err = helpers.LunchPunch(byuID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

// OtherHours adds entry to sick time
func OtherHours(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date are all passed in the url
	byuID := context.Param("id")

	var incomingRequest structs.ClientOtherHoursRequest
	err := context.Bind(incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	err = helpers.OtherHours(byuID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

//NewWorkOrderEntry handles adding a new WorkOrderEntry (post)
func NewWorkOrderEntry(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date, and Sequence Number are all passed in the url
	byuID := context.Param("id")
	jobIDString := context.Param("jobid")

	jobID, _ := strconv.Atoi(jobIDString)

	var incomingRequest structs.ClientWorkOrderEntry
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	err = helpers.NewWorkOrderEntry(byuID, jobID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

//EditWorkOrderEntry handles editing WorkOrderEntry (put)
func EditWorkOrderEntry(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date, and Sequence Number are all passed in the url
	byuID := context.Param("id")
	jobIDString := context.Param("jobid")

	jobID, _ := strconv.Atoi(jobIDString)

	var incomingRequest structs.ClientWorkOrderEntry
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	err = helpers.EditWorkOrderEntry(byuID, jobID, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

// DeletePunch deletes an added punch
func DeletePunch(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date, Sequence number are all passed in the url
	byuID := context.Param("id")
	jobIDString := context.Param("jobid")

	jobID, _ := strconv.Atoi(jobIDString)
	seqNum := context.Param("seqnum")

	var incomingRequest structs.ClientDeletePunch
	err := context.Bind(&incomingRequest)
	if err != nil {
		return context.String(http.StatusBadRequest, err.Error())
	}

	err = helpers.DeletePunch(byuID, jobID, seqNum, incomingRequest)
	if err != nil {
		return context.String(http.StatusInternalServerError, err.Error())
	}

	return context.String(http.StatusOK, "ok")
}

//SendEvent passes an event to the messenger
func SendEvent(context echo.Context) error {
	var event commonEvents.Event
	gerr := context.Bind(&event)
	if gerr != nil {
		return context.String(http.StatusBadRequest, gerr.Error())
	}

	eventsender.MyMessenger.SendEvent(event)

	log.L.Debugf("sent event from UI: %+v", event)
	return context.String(http.StatusOK, "success")
}

//GetSickAndVacationForJobAndDate handles ensuring that we have the sick and vacation for a day
func GetSickAndVacationForJobAndDate(context echo.Context) error {
	//BYU ID, EmployeeJobID, Punch Date, and Sequence Number are all passed in the url
	byuID := context.Param("id")
	jobIDString := context.Param("jobid")
	dateString := context.Param("date")

	jobID, _ := strconv.Atoi(jobIDString)
	date, _ := time.ParseInLocation("2006-01-02", dateString, time.Local)

	cache.GetOtherHoursForJobAndDate(byuID, jobID, date)

	return context.String(http.StatusOK, "ok")
}
