
const capitalizeName = (myName) => {

    const nameArray = myName.split(" ");
    const correctName = [];
    nameArray.forEach((item) => {
        const lowerCase = item.toLowerCase();
        const fLetter = lowerCase.slice(0, 1).toUpperCase();
        const rletters = lowerCase.slice(1, lowerCase.length);
        const finalName = fLetter + rletters;
        correctName.push(finalName);
    });
    const theName = correctName.join(" ");
    return theName;
};

module.exports = {
    capitalizeName
}