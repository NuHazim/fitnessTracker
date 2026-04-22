const workForm=document.getElementById("workForm");
const cancelButton=document.getElementById("cancelButton");
const templateWorkBox=document.getElementById("templateWorkBox");

const workSteps=document.getElementById("workSteps");
const workCal=document.getElementById("workCal");
const workNotes=document.getElementById("workNotes");

const workHisBox=document.getElementById("workHisBox");

const totalWorks=document.getElementById("totalWorks");
const totalMins=document.getElementById("totalMins");
const totalSteps=document.getElementById("totalSteps");
const totalCals=document.getElementById("totalCals");
function validateAndSubmit(){
    if(workForm.checkValidity()){
        const clone=templateWorkBox.content.cloneNode(true);
        const workoutName=clone.querySelector("#workoutName");
        workoutName.textContent=document.getElementById("workType").value;
        totalWorks.textContent=Number(totalWorks.textContent)+1;

        const dateWork=clone.querySelector("#dateWork");
        dateWork.innerHTML="<i class=\"fa-regular fa-calendar\"></i> "+document.getElementById("workDate").value;

        const timeWork=clone.querySelector("#timeWork");
        timeWork.innerHTML="<i class=\"fa-regular fa-clock\"></i> "+document.getElementById("workTime").value;

        const minWork=clone.querySelector("#minWork");
        minWork.textContent=document.getElementById("workMin").value+" min";
        totalMins.textContent=Number(totalMins.textContent)+Number(document.getElementById("workMin").value);

        const workStepsValue=workSteps.valueAsNumber;
        if(!isNaN(workStepsValue)){
            const stepsWork=clone.querySelector("#stepsWork");
            stepsWork.textContent=workStepsValue+" steps";
            totalSteps.textContent=Number(totalSteps.textContent)+workStepsValue;
        }

        const workCalValue=workCal.valueAsNumber;
        if(!isNaN(workCalValue)){
            const calWork=clone.querySelector("#calWork");
            calWork.textContent=workCalValue+" cal";
            totalCals.textContent=Number(totalCals.textContent)+workCalValue;
        }

        if(workNotes.value!=""){
            const notesWork=clone.querySelector("#notesWork");
            notesWork.textContent=workNotes.value;
        }

        workHisBox.appendChild(clone);
        cancelButton.click();
        workForm.reset();
    }else{
        workForm.reportValidity();
    }
}
