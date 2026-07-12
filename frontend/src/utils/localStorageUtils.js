export const getLocalStorageItem = (key) => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error(`Error reading/parsing key "${key}":`, error);
        return null;
    }
};

export const saveProjectToStorage = (key, data, currentProjects) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(data));
        return currentProjects.includes(key) ? currentProjects : [...currentProjects, key];
    } catch (error) {
        console.error("Error writing to localStorage:", error);
        return currentProjects;
    }
};
export const loadSavedProjects = () => {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const val = getLocalStorageItem(key);
        if (val && val.hierarchy) {
            list.push(key);
        }
    };
    return list
}


export const deleteProjectFromStorage = (key, currentProjects) => {
    try {
        window.localStorage.removeItem(key);
        return currentProjects.filter(item => item !== key);
    } catch (error) {
        console.error("Error deleting from localStorage:", error);
        return currentProjects;
    }
};
