function randomSample(population: Array<any>,nb_picks:number){
        // using Fisher-Yates (aka Knuth) Shuffle
        // stops after swapping the LAST nb_picks elements
        // as these are not affected by further iterations
        // https://stackoverflow.com/questions/2380019/generate-unique-random-numbers-between-1-and-100
        var size = population.length;
        if (nb_picks>size)
          {throw new RangeError("random_sample: more elements taken than available")};
        for (var i = size-1; i > (size-nb_picks-1) ; i--)
           {
               var r = Math.floor(Math.random()*i);
               [population[r], population[i]] = [population[i], population[r]];
           }
        return population.slice((size-nb_picks), size);
};
 
export {randomSample}