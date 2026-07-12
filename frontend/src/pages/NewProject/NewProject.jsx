import { useRef, useState } from "react";
import Input from "../../components/ui/Input/Input";
import { transformToHierarchy } from "../../utils/treeHelpers";
import { useTreeDiagram } from "../../context/TreeContext";
import { useNavigate } from "react-router-dom";
import './NewProject.css';
import { useProjects } from "../../context/ProjectsContext";


const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
};

export default function NewProject() {
    const [errorMessage, setErrorMessage] = useState("");
    const [tempTree, setTempTree] = useState(null);
    const navigate = useNavigate();

    const formRef = useRef(null);
    const { setTreeDiagram } = useTreeDiagram();
    const { saveProject } = useProjects()

    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (file && file.name !== "architecture.json") {
            setErrorMessage("Please upload only architecture.json");
            event.target.value = "";
            return;
        }

        setErrorMessage("");
        if (!file) return;

        try {
            const fileContent = await readFileAsText(file);
            const asJson = JSON.parse(fileContent);
            const formatTree = transformToHierarchy(asJson);
            setTempTree(formatTree);
        } catch (error) {
            console.error("Error: ", error);
            setErrorMessage("There was an error extracting your file please try again");
            event.target.value = "";
        };
    };

    const handelSubmit = (formData) => {
        const ProjectName = formData.get('projectTitle');
        if (!tempTree || !ProjectName) {
            setErrorMessage("Sorry, something is missing, please make sure that you fill all the necessary fields");
            return;
        }
        setTreeDiagram(tempTree);
        saveProject(ProjectName, tempTree);
        return navigate(`/dashboard/${ProjectName}`);
    }

    return (
        <>
            <form ref={formRef} action={handelSubmit} className="projectTreeForm">
                <label>
                    Project Details:
                    <Input type="text" placeholder="Enter project name" name="projectTitle" />
                    <br />
                    <Input type="file" name="architecture" accept=".json" onChange={handleFileChange} />
                    <br />
                </label>
                <Input value="submit" type="submit" />
            </form>
            {errorMessage && <p className="error">{errorMessage}</p>}
        </>
    );
}