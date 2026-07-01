// ==========================
// Login Page
// ==========================
const loginBtn = document.getElementById("loginBtn");
if(loginBtn){
    loginBtn.addEventListener("click",login);
}
async function login(){
    const username =
        document.getElementById("username").value.trim();
    const password =
        document.getElementById("password").value.trim();
    try{
        const response = await fetch("/admin/login",{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                username,
                password
            })
        });
        const result = await response.json();
        if(result.success){
            localStorage.setItem("adminLoggedIn","true");
            window.location="/dashboard";
        }
        else{
            document.getElementById("error").textContent =
                "Invalid Username or Password";
        }
    }
    catch(error){
        document.getElementById("error").textContent =
            "Unable to connect to server.";
    }
}
// ==========================
// Dashboard
// ==========================
if(document.getElementById("tableBody")){
    if(localStorage.getItem("adminLoggedIn")!=="true"){
        window.location="login.html";
    }
    loadUsers();
}
// ==========================
async function loadUsers(){
    const response = await fetch("/users");
    const users = await response.json();
    const body =
        document.getElementById("tableBody");
    body.innerHTML="";
    users.forEach(user=>{
        body.innerHTML += `
<tr>
<td>${user.name}</td>
<td>${user.latitude}</td>
<td>${user.longitude}</td>
<td>${user.city}</td>
<td>${user.country}</td>
<td>${new Date(user.createdAt).toLocaleString()}</td>
<td>
<button
class="btn delete"
onclick="deleteUser('${user._id}')">
Delete
</button>
</td>
</tr>
`;
    });
}
// ==========================
async function deleteUser(id){
    if(!confirm("Delete this user?")) return;
    await fetch("/users/"+id,{
        method:"DELETE"
    });
    loadUsers();
}
// ==========================
document.getElementById("refreshBtn")?.addEventListener(
"click",
loadUsers
);
// ==========================
document.getElementById("searchBox")?.addEventListener(
"keyup",
function(){
const value=this.value.toLowerCase();
const rows=document.querySelectorAll("tbody tr");
rows.forEach(row=>{
row.style.display=row.innerText.toLowerCase().includes(value)
?""
:"none";
});
}
);
// ==========================
document.getElementById("exportBtn")?.addEventListener(
"click",
()=>{
const rows=document.querySelectorAll("table tr");
let csv=[];
rows.forEach(r=>{
let cols=r.querySelectorAll("th,td");
let row=[];
cols.forEach(c=>row.push(c.innerText));
csv.push(row.join(","));
});
const blob=new Blob([csv.join("\n")],{
type:"text/csv"
});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");
a.href=url;
a.download="WeatherSphereUsers.csv";
a.click();
}
);