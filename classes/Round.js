module.exports = class Round {
    /**
     * A way to store Trumpf and Farbe zum angeben in an Round object
     * @param {number} trumpf one of 4 colors 1 - 4
     * @param {number} farbeZumAngeben one of 4 colors 1 - 4
     */
    constructor(trumpf,farbeZumAngeben) {
        this.trumpf = trumpf;
        this.farbeZumAngeben = farbeZumAngeben;
    }
}
