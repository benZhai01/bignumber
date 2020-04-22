const testDigit = function (digit) {
    return (/^\d$/.test(digit));
};

const abs = function (number) {
    var bigNumber;
    if (typeof number === 'undefined') {
        return;
    }
    bigNumber = new BigNumber(number);
    bigNumber.sign = 1;
    return bigNumber;
};

const isArray = function (arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
};

const isValidType = function (number) {
    return [
        typeof number === 'number',
        typeof number === 'string' && number.length > 0,
        isArray(number) && number.length > 0,
        number instanceof BigNumber
    ].some(function (bool) {
        return bool === true;
    });
};

const errors = {
    'invalid': 'Invalid Number',
    'division by zero': 'Invalid Number - Division By Zero'
};

class BigNumber {
    private number;
    private sign;
    private rest;

    constructor(initialNumber) {
        var index;

        this.number = [];
        this.sign = 1;
        this.rest = 0;

        // The initial number can be an array, string, number of another big number
        // e.g. array     : [3,2,1], ['+',3,2,1], ['-',3,2,1]
        //      number    : 312
        //      string    : '321', '+321', -321'
        //      BigNumber : BigNumber(321)
        // Every character except the first must be a digit

        if (!isValidType(initialNumber)) {
            this.number = errors['invalid'];
            return;
        }

        if (isArray(initialNumber)) {
            if (initialNumber.length && initialNumber[0] === '-' || initialNumber[0] === '+') {
                this.sign = initialNumber[0] === '+' ? 1 : -1;
                initialNumber.shift(0);
            }
            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!this.addDigit(initialNumber[index]))
                    return;
            }
        } else {
            initialNumber = initialNumber.toString();
            if (initialNumber.charAt(0) === '-' || initialNumber.charAt(0) === '+') {
                this.sign = initialNumber.charAt(0) === '+' ? 1 : -1;
                initialNumber = initialNumber.substring(1);
            }

            for (index = initialNumber.length - 1; index >= 0; index--) {
                if (!this.addDigit(parseInt(initialNumber.charAt(index), 10))) {
                    return;
                }
            }
        }
    }

    public addDigit(digit) {
        if (testDigit(digit)) {
            this.number.push(digit);
        } else {
            this.number = errors['invalid'];
            return false;
        }

        return this;
    }

    public isEven() {
        return this.number[0] % 2 === 0;
    }

    private _compare(number) {
        var bigNumber;
        var index;

        if (!isValidType(number)) {
            return null;
        }

        bigNumber = new BigNumber(number);

        // If the numbers have different signs, then the positive
        // number is greater
        if (this.sign !== bigNumber.sign) {
            return this.sign;
        }

        // Else, check the length
        if (this.number.length > bigNumber.number.length) {
            return this.sign;
        } else if (this.number.length < bigNumber.number.length) {
            return this.sign * (-1);
        }

        // If they have similar length, compare the numbers
        // digit by digit
        for (index = this.number.length - 1; index >= 0; index--) {
            if (this.number[index] > bigNumber.number[index]) {
                return this.sign;
            } else if (this.number[index] < bigNumber.number[index]) {
                return this.sign * (-1);
            }
        }

        return 0;
    }

    public gt(number) {
        return this._compare(number) > 0;
    }

    public gte(number) {
        return this._compare(number) >= 0;
    }

    public equals(number) {
        return this._compare(number) === 0;
    }

    public lte(number) {
        return this._compare(number) <= 0;
    }

    public lt(number) {
        return this._compare(number) < 0;
    }

    public add(number) {
        var bigNumber;
        if (typeof number === 'undefined') {
            return this;
        }
        bigNumber = new BigNumber(number);

        if (this.sign !== bigNumber.sign) {
            if (this.sign > 0) {
                bigNumber.sign = 1;
                return this.minus(bigNumber);
            }
            else {
                this.sign = 1;
                return bigNumber.minus(this);
            }
        }

        this.number = BigNumber._add(this, bigNumber);
        return this;
    }

    public minus(number) {
        var bigNumber;
        if (typeof number === 'undefined') {
            return this;
        }
        bigNumber = new BigNumber(number);

        if (this.sign !== bigNumber.sign) {
            this.number = BigNumber._add(this, bigNumber);
            return this;
        }

        // If current number is lesser than the given bigNumber, the result will be negative
        this.sign = (this.lt(bigNumber)) ? -1 : 1;
        this.number = (abs(this).lt(abs(bigNumber)))
            ? BigNumber._subtract(bigNumber, this)
            : BigNumber._subtract(this, bigNumber);

        return this;
    }

    private static _add(a: BigNumber, b: BigNumber) {
        var index;
        var remainder = 0;
        var length = Math.max(a.number.length, b.number.length);

        for (index = 0; index < length || remainder > 0; index++) {
            a.number[index] = (remainder += (a.number[index] || 0) + (b.number[index] || 0)) % 10;
            remainder = Math.floor(remainder / 10);
        }

        return a.number;
    }

    private static _subtract(a: BigNumber, b: BigNumber) {
        var index;
        var remainder = 0;
        var length = a.number.length;

        for (index = 0; index < length; index++) {
            a.number[index] -= (b.number[index] || 0) + remainder;
            a.number[index] += (remainder = (a.number[index] < 0) ? 1 : 0) * 10;
        }
        // Count the zeroes which will be removed
        index = 0;
        length = a.number.length - 1;
        while (a.number[length - index] === 0 && length - index > 0) {
            index++;
        }
        if (index > 0) {
            a.number.splice(-index);
        }
        return a.number;
    }

    public multiply(number) {
        if (typeof number === 'undefined') {
            return this;
        }
        var bigNumber = new BigNumber(number);
        var index;
        var givenNumberIndex;
        var remainder = 0;
        var result = [];

        if (this.isZero() || bigNumber.isZero()) {
            return new BigNumber(0);
        }

        this.sign *= bigNumber.sign;

        // multiply the numbers
        for (index = 0; index < this.number.length; index++) {
            for (remainder = 0, givenNumberIndex = 0; givenNumberIndex < bigNumber.number.length || remainder > 0; givenNumberIndex++) {
                result[index + givenNumberIndex] = (remainder += (result[index + givenNumberIndex] || 0) + this.number[index] * (bigNumber.number[givenNumberIndex] || 0)) % 10;
                remainder = Math.floor(remainder / 10);
            }
        }

        this.number = result;
        return this;
    }

    public divide(number) {
        if (typeof number === 'undefined') {
            return this;
        }

        var bigNumber = new BigNumber(number);
        var index;
        var length;
        var result = [];
        var rest = new BigNumber(0);

        // test if one of the numbers is zero
        if (bigNumber.isZero()) {
            this.number = errors['division by zero'];
            return this;
        } else if (this.isZero()) {
            this.rest = new BigNumber(0);
            return this;
        }

        this.sign *= bigNumber.sign;
        bigNumber.sign = 1;

        // Skip division by 1
        if (bigNumber.number.length === 1 && bigNumber.number[0] === 1) {
            this.rest = new BigNumber(0);
            return this;
        }

        for (index = this.number.length - 1; index >= 0; index--) {
            rest.multiply(10);
            rest.number[0] = this.number[index];
            result[index] = 0;
            while (bigNumber.lte(rest)) {
                result[index]++;
                rest.minus(bigNumber);
            }
        }

        index = 0;
        length = result.length - 1;
        while (result[length - index] === 0 && length - index > 0) {
            index++;
        }
        if (index > 0) {
            result.splice(-index);
        }

        this.rest = rest;
        this.number = result;
        return this;
    }

    public mod(number) {
        return this.divide(number).rest;
    }

    public power(number) {
        if (typeof number === 'undefined')
            return;
        var bigNumber;
        var bigNumberPower;
        // Convert the argument to a big number
        if (!isValidType(number)) {
            this.number = errors['invalid'];
            return;
        }
        bigNumberPower = new BigNumber(number);
        if (bigNumberPower.isZero()) {
            return new BigNumber(1);
        }
        if (bigNumberPower.val() === '1') {
            return this;
        }

        bigNumber = new BigNumber(this);

        this.number = [1];
        while (bigNumberPower.gt(0)) {
            if (!bigNumberPower.isEven()) {
                this.multiply(bigNumber);
                bigNumberPower.subtract(1);
                continue;
            }
            bigNumber.multiply(bigNumber);
            bigNumberPower.div(2);
        }

        return this;
    }

    public abs() {
        this.sign = 1;
        return this;
    }

    public isZero() {
        var index;
        for (index = 0; index < this.number.length; index++) {
            if (this.number[index] !== 0) {
                return false;
            }
        }

        return true;
    }

    public toString() {
        var index;
        var str = '';
        if (typeof this.number === 'string') {
            return this.number;
        }

        for (index = this.number.length - 1; index >= 0; index--) {
            str += this.number[index];
        }

        return (this.sign > 0) ? str : ('-' + str);
    }
}