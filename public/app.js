class WeatherSphere {
    constructor() {
        this.baseURL = "https://wttr.in";
        this.user = {
            name: "",
            latitude: null,
            longitude: null,
            city: "",
            country: ""
        };
        this.init();
    }
    async init() {
        this.cacheDOM();
        this.bindEvents();
        this.startClock();
        this.checkInternet();
        const savedName = localStorage.getItem("weatherSphereName");
        if (savedName) {
            this.user.name = savedName;
            this.displayName.textContent = `Welcome, ${savedName}`;
            this.nameModal.style.display = "none";
            this.requestLocation();
        }
    }
    cacheDOM() {
        this.nameModal = document.getElementById("nameModal");
        this.nameInput = document.getElementById("userName");
        this.continueBtn = document.getElementById("continueBtn");
        this.displayName = document.getElementById("displayName");
        this.cityName = document.getElementById("cityName");
        this.coordinates = document.getElementById("coordinates");
        this.currentDate = document.getElementById("currentDate");
        this.currentTime = document.getElementById("currentTime");
        this.loading = document.getElementById("loadingSkeleton");
        this.weatherContent = document.getElementById("weatherContent");
    }
    bindEvents() {
        this.continueBtn.addEventListener("click", () => {
            this.saveName();
        });
    }
    saveName() {
        const name = this.nameInput.value.trim();
        if (name.length < 2) {
            this.showToast("Enter a valid name","error");
            return;
        }
        localStorage.setItem("weatherSphereName",name);
        this.user.name = name;
        this.displayName.textContent = `Welcome, ${name}`;
        this.nameModal.style.display = "none";
        this.requestLocation();
    }
    requestLocation() {
        if(!navigator.geolocation){
            this.showToast("Geolocation not supported","error");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position)=>{
                this.user.latitude = position.coords.latitude;
                this.user.longitude = position.coords.longitude;
                this.coordinates.textContent =
                    `${this.user.latitude.toFixed(5)}°, ${this.user.longitude.toFixed(5)}°`;
                this.showToast("Location detected","success");
                this.fetchWeather();
            },
            ()=>{
                this.showToast("Location denied. Using London.","info");
                this.user.latitude = 51.5072;
                this.user.longitude = -0.1276;
                this.cityName.textContent = "Search Result";
                this.coordinates.textContent = "No Coordinates";
                this.fetchWeather();
            },
            {
                enableHighAccuracy:true,
                timeout:10000,
                maximumAge:0
            }
        );
    }
    startClock(){
        const update=()=>{
            const now=new Date();
            this.currentDate.textContent=
                now.toLocaleDateString(
                    "en-US",
                    {
                        weekday:"short",
                        month:"short",
                        day:"numeric",
                        year:"numeric"
                    }
                );
            this.currentTime.textContent=
                now.toLocaleTimeString(
                    "en-US",
                    {
                        hour:"2-digit",
                        minute:"2-digit",
                        second:"2-digit",
                        hour12:true
                    }
                );
        };
        update();
        setInterval(update,1000);
    }
    checkInternet(){
        window.addEventListener("offline",()=>{
            this.showToast("You are offline","error");
        });
        window.addEventListener("online",()=>{
            this.showToast("Internet Connected","success");
        });
    }
    async fetchWeather() {
        try {
            this.loading.style.display = "block";
            this.weatherContent.style.display = "none";
            const response = await fetch(
    `/weather?lat=${this.user.latitude}&lon=${this.user.longitude}`
);
            if (!response.ok) {
                throw new Error("Unable to fetch weather data");
            }
            const data = await response.json();
            this.weatherData = data;
            // Current location
            this.user.city =
                data.nearest_area?.[0]?.areaName?.[0]?.value || "Unknown";
            this.user.country =
                data.nearest_area?.[0]?.country?.[0]?.value || "";
            this.cityName.textContent =
                `${this.user.city}, ${this.user.country}`;
            // Save user to MongoDB
            await this.saveUser();
            // Update Weather UI
            this.updateCurrentWeather();
            this.renderHourlyForecast();
            this.renderDailyForecast();
            // Last Updated
            document.getElementById("lastUpdated").textContent =
                new Date().toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                });
            this.loading.style.display = "none";
            this.weatherContent.style.display = "block";
            this.showToast("Weather Updated","success");
        }
        catch(error){
            console.error(error);
            this.loading.style.display = "none";
            this.showToast(error.message,"error");
        }
    }
    async saveUser(){
        try{
            await fetch("/save-user",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    name:this.user.name,
                    latitude:this.user.latitude,
                    longitude:this.user.longitude,
                    city:this.user.city,
                    country:this.user.country
                })
            });
        }
        catch(error){
            console.error(error);
        }
    }
    updateCurrentWeather(){
        const current =
            this.weatherData.current_condition[0];
        document.getElementById("locationTitle").textContent =
            this.user.city;
        document.getElementById("temperature").textContent =
            `${current.temp_C}°C`;
        document.getElementById("condition").textContent =
            current.weatherDesc[0].value;
        document.getElementById("description").textContent =
            `Feels like ${current.FeelsLikeC}°C • Humidity ${current.humidity}%`;
        document.getElementById("feelsLike").textContent =
            `${current.FeelsLikeC}°C`;
        document.getElementById("humidity").textContent =
            `${current.humidity}%`;
        document.getElementById("pressure").textContent =
            `${current.pressure} hPa`;
        document.getElementById("uv").textContent =
            current.uvIndex;
        document.getElementById("visibility").textContent =
            `${current.visibility} km`;
        const astronomy =
            this.weatherData.weather[0].astronomy[0];
        document.getElementById("sunrise").textContent =
            astronomy.sunrise;
        document.getElementById("sunset").textContent =
            astronomy.sunset;
        const icon =
            this.getWeatherIcon(current.weatherCode);
        const iconElement =
            document.getElementById("weatherIcon");
        iconElement.className =
            `fa-solid ${icon.class} fa-5x ${icon.color}`;
    }
    renderHourlyForecast() {
        const container = document.getElementById("hourlyContainer");
        container.innerHTML = "";
        const hourly = this.weatherData.weather[0].hourly;
        hourly.slice(0, 12).forEach(hour => {
            const icon = this.getWeatherIcon(hour.weatherCode);
            const time = this.formatHour(hour.time);
            container.innerHTML += `
                <div class="hour-card fade">
                    <h4>${time}</h4>
                    <i class="fa-solid ${icon.class} ${icon.color}"></i>
                    <p>${hour.tempC}°C</p>
                </div>
            `;
        });
    }
    renderDailyForecast() {
        const container = document.getElementById("dailyContainer");
        container.innerHTML = "";
        this.weatherData.weather.forEach(day => {
            const icon = this.getWeatherIcon(day.hourly[4].weatherCode);
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );
            container.innerHTML += `
                <div class="day-card fade">
                    <div class="day-name">
                        ${dayName}
                    </div>
                    <div class="day-icon">
                        <i class="fa-solid ${icon.class} ${icon.color}"></i>
                    </div>
                    <div class="day-temp">
                        ${day.maxtempC}° / ${day.mintempC}°
                    </div>
                    <div class="day-rain">
                        🌧 ${day.hourly[4].chanceofrain}%
                    </div>
                </div>
            `;
        });
    }
    formatHour(value){
        let hour = parseInt(value);
        if(hour===2400) hour=0;
        hour = hour/100;
        const suffix = hour>=12 ? "PM":"AM";
        let display = hour%12;
        if(display===0) display=12;
        return `${display}:00 ${suffix}`;
    }
    getWeatherIcon(code){
        code = Number(code);
        if(code===113){
            return{
                class:"fa-sun",
                color:"sunny"
            };
        }
        if(code===116){
            return{
                class:"fa-cloud-sun",
                color:"partly"
            };
        }
        if([119,122].includes(code)){
            return{
                class:"fa-cloud",
                color:"cloudy"
            };
        }
        if([143,248,260].includes(code)){
            return{
                class:"fa-smog",
                color:"fog"
            };
        }
        if([
            176,263,266,281,284,
            293,296,299,302,305,
            308,311,314,317,320,
            350,353,356,359,
            362,365,368,371,
            374,377
        ].includes(code)){
            return{
                class:"fa-cloud-rain",
                color:"rain"
            };
        }
        if([
            179,182,185,
            227,230,
            323,326,
            329,332,
            335,338
        ].includes(code)){
            return{
                class:"fa-snowflake",
                color:"snow"
            };
        }
        if([
            200,
            386,
            389,
            392,
            395
        ].includes(code)){
            return{
                class:"fa-cloud-bolt",
                color:"thunder"
            };
        }
        return{
            class:"fa-cloud",
            color:"cloudy"
        };
    }
    showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        let icon = "fa-circle-info";
        if (type === "success") icon = "fa-circle-check";
        if (type === "error") icon = "fa-circle-exclamation";
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = "toastOut .4s forwards";
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 3500);
    }
    startAutoRefresh() {
        setInterval(() => {
            if (navigator.onLine) {
                this.fetchWeather();
            }
        }, 900000);
    }
}
// ================================
// Start WeatherSphere
// ================================
window.addEventListener("DOMContentLoaded", () => {
    const app = new WeatherSphere();
    app.startAutoRefresh();
});