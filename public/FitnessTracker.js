const workForm=document.getElementById("workForm");
const cancelButton=document.getElementById("cancelButton");
const templateWorkBox=document.getElementById("templateWorkBox");

const workType= document.getElementById("workType");
const workDate= document.getElementById("workDate");
const workTime= document.getElementById("workTime");
const workMin= document.getElementById("workMin");
const workSteps=document.getElementById("workSteps");
const workCal=document.getElementById("workCal");
const workNotes=document.getElementById("workNotes");

const workHisContainer=document.getElementById("workHisContainer");

const totalWorks=document.getElementById("totalWorks");
const totalMins=document.getElementById("totalMins");
const totalSteps=document.getElementById("totalSteps");
const totalCals=document.getElementById("totalCals");
const noWorkBox=document.getElementById("noWorkBox");

const updateWorkButton=document.getElementById("updateWorkButton");
const saveWorkButton=document.getElementById("saveWorkButton");
document.querySelector(".logWorkoutButton, .logFirstWorkoutButton").addEventListener("click",function(){
    updateWorkButton.style.display="none";
    saveWorkButton.style.display="block";
    workForm.reset();
});
function updateTotals(){
    const boxes=workHisContainer.querySelectorAll(".workBox");
    //total workouts
    totalWorks.textContent =boxes.length;
    //total minutes
    //total steps
    //total calories
    let count=0,countv2=0,countv3=0;
    boxes.forEach(box=>{
        count=count+parseInt(box.querySelector("#minWork").textContent);
        let boxSteps=box.querySelector("#stepsWork");
        let boxCals=box.querySelector("#calWork");
        if(boxSteps.textContent!=""){
            countv2=countv2+parseInt(boxSteps.textContent);
        }
        if(boxCals.textContent!=""){
            countv3=countv3+parseInt(boxCals.textContent);
        }
    });
    totalMins.textContent=count;
    totalSteps.textContent=countv2;
    totalCals.textContent=countv3;
   
}
function validateAndSubmit(){
    if(workForm.checkValidity()){
        const clone=templateWorkBox.content.cloneNode(true);
        const workoutName=clone.querySelector("#workoutName");
        workoutName.textContent = workType.value;
        

        const dateWork = clone.querySelector("#dateWork");
        dateWork.innerHTML = `<i class="fa-regular fa-calendar"></i> ${workDate.value}`;

        const timeWork = clone.querySelector("#timeWork");
        timeWork.innerHTML = `<i class="fa-regular fa-clock"></i> ${workTime.value}`;

        const minWork = clone.querySelector("#minWork");
        minWork.textContent=workMin.value+" min";

        const workStepsValue=workSteps.valueAsNumber;
        if(!isNaN(workStepsValue)){
            const stepsWork=clone.querySelector("#stepsWork");
            stepsWork.textContent=workStepsValue+" steps";
        }

        const workCalValue=workCal.valueAsNumber;
        if(!isNaN(workCalValue)){
            const calWork=clone.querySelector("#calWork");
            calWork.textContent=workCalValue+" cal";
        }

        if(workNotes.value!=""){
            const notesWork=clone.querySelector("#notesWork");
            notesWork.textContent=workNotes.value;
        }
        workHisContainer.appendChild(clone);
        cancelButton.click();
        workForm.reset();
        noWorkBox.style.display="none";
        updateTotals();
    }else{
        workForm.reportValidity();
    }
}

workHisContainer.addEventListener("click",function(e){
    if(e.target.classList.contains("editButton")){
        const box=e.target.closest(".workBox");
        document.querySelector(".logWorkoutButton").click();
        updateWorkButton.style.display="block";
        saveWorkButton.style.display="none";
        let tempWorkoutName=box.querySelector("#workoutName");
        let tempDateWork=box.querySelector("#dateWork");
        let tempTimeWork=box.querySelector("#timeWork");
        let tempMinWork=box.querySelector("#minWork");
        let tempStepsWork=box.querySelector("#stepsWork");
        let tempCalWork=box.querySelector("#calWork");
        let tempNotesWork=box.querySelector("#notesWork");
        workType.value=tempWorkoutName.textContent;
        workDate.value=tempDateWork.textContent.trim();
        workTime.value=tempTimeWork.textContent.trim();
        workMin.value=parseInt(tempMinWork.textContent);
        
        if(tempStepsWork.textContent!=""){
            workSteps.value=parseInt(tempStepsWork.textContent);
        }
        if(tempCalWork.textContent!=""){
            workCal.value=parseInt(tempCalWork.textContent);
        }
        if(tempNotesWork.textContent!=""){
            workNotes.value=tempNotesWork.textContent;
        }
        updateWorkButton.onclick=function(){
            if(workForm.checkValidity()){
                tempWorkoutName.textContent=workType.value;
                tempDateWork.innerHTML=`<i class="fa-regular fa-calendar"></i> ${workDate.value}`;
                tempTimeWork.innerHTML=`<i class="fa-regular fa-clock"></i> ${workTime.value}`;
                tempMinWork.textContent=workMin.value+" min";
                totalMins.textContent=Number(totalMins.textContent)+Number(workMin.value);
                if(!isNaN(workSteps.valueAsNumber)){
                    tempStepsWork.textContent=workSteps.valueAsNumber+" steps";
                }
                else{
                    tempStepsWork.textContent="";
                }
                if(!isNaN(workCal.valueAsNumber)){
                    tempCalWork.textContent=workCal.valueAsNumber+" cal";
                }
                else{
                    tempCalWork.textContent="";
                }
                if(workNotes.value!=""){
                    tempNotesWork.textContent=workNotes.value;
                }
                else{
                    tempNotesWork.textContent="";
                }
                updateTotals();
                cancelButton.click();
            }
            else{
                workForm.reportValidity();
            }
        };
    }
    if(e.target.classList.contains("deleteButton")){
        const box=e.target.closest(".workBox");
        box.remove();
        updateTotals();
    }
});
