class Bot {
    name = 'bot';
    constructor(name) {
        this.name = name;
    }

    chooseTrumpf(cards) {
        colorValues = [0, 0, 0, 0];
        for(const card of cards) {
            colorValues[card.color - 1] += card.value;
        }
        const indexOfMax = this.#indexOfMax(colorValues);
        return indexOfMax; // index??
    }

    chooseCard(center, hand) {
        // possible cards
        // best card
        return card; // index??
    }

    #indexOfMax(arr) {
        if (arr.length === 0) {
            return -1;
        }
    
        var max = arr[0];
        var maxIndex = 0;
    
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                maxIndex = i;
                max = arr[i];
            }
        }
    
        return maxIndex;
    }
}