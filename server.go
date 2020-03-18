package main

import (
	"fmt"
	"net/http"

	"github.com/byuoitav/pi-time/cache"
	figure "github.com/common-nighthawk/go-figure"
	"github.com/labstack/echo/v4"

	"github.com/byuoitav/common/log"
	"github.com/byuoitav/pi-time/handlers"
	"github.com/byuoitav/pi-time/helpers"
	"github.com/labstack/echo/v4/middleware"
)

var updateCacheNowChannel = make(chan struct{})

func main() {
	figure.NewFigure("P-TIME", "ntgreek", true).Print()
	fmt.Print("\n\n")
	log.SetLevel("debug")

	//start a go routine to go and get the latitude and longitude from the building struct
	go cache.GetYtimeLocation()

	//start a go routine that will pull the cache information for offline mode
	go helpers.WatchForCachedEmployees(updateCacheNowChannel)

	//start a go routine that will monitor the persistent cache for punches that didn't get posted and post them once the clock comes online
	//TODO

	//start up a server to serve the angular site and set up the handlers for the UI to use
	port := ":8463"

	router := echo.New()

	// health endpoint
	router.GET("/healthz", func(c echo.Context) error {
		return c.String(http.StatusOK, "healthy")
	})

	//login and upgrade to websocket
	router.GET("/id/:id", handlers.LogInUser)

	//all of the functions to call to add / update / delete / do things on the UI

	//clock in
	//clock out
	//transfer
	//add missing punch
	router.POST("/punch/:id", handlers.Punch)        //will send in a ClientPunchRequest in the body
	router.PUT("/punch/:id/:seq", handlers.FixPunch) //will send in a ClientPunchRequest in the body

	//lunchpunch
	router.POST("/lunchpunch/:id", handlers.LunchPunch)

	//get sick and vacation
	router.GET("/otherhours/:id/:jobid/:date", handlers.GetSickAndVacationForJobAndDate)

	//add sick or vacation
	router.PUT("/otherhours/:id", handlers.OtherHours)

	// add/edit work order entry
	router.POST("/workorderentry/:id", handlers.UpsertWorkOrderEntry)

	//delete work order entry
	router.DELETE("/workorderentry/:id", handlers.DeleteWorkOrderEntry)

	//delete duplicate punch
	router.DELETE("/punch/:id", handlers.DeletePunch)

	//endpoint for UI events
	router.POST("/event", handlers.SendEvent)

	//force an update of the employee cache
	router.PUT("/updateCache", updateCacheNow)

	router.GET("/", func(c echo.Context) error {
		return c.Redirect(http.StatusTemporaryRedirect, "/analog")
	})

	//serve the angular web page
	router.Group("/analog", middleware.StaticWithConfig(middleware.StaticConfig{
		Root:   "analog",
		Index:  "index.html",
		HTML5:  true,
		Browse: true,
	}))

	server := http.Server{
		Addr:           port,
		MaxHeaderBytes: 1024 * 10,
	}

	router.StartServer(&server)
}

func updateCacheNow(ectx echo.Context) error {
	updateCacheNowChannel <- struct{}{}

	return ectx.String(http.StatusOK, "cache update initiated")
}
